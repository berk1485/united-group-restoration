require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
const Datastore = require('@seald-io/nedb');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database Setup (NeDB - pure JS, no native compilation) ──────────────────
const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = {
  leads:    new Datastore({ filename: path.join(DB_DIR, 'leads.db'),    autoload: true }),
  photos:   new Datastore({ filename: path.join(DB_DIR, 'photos.db'),   autoload: true }),
  bookings: new Datastore({ filename: path.join(DB_DIR, 'bookings.db'), autoload: true }),
  chat:     new Datastore({ filename: path.join(DB_DIR, 'chat.db'),     autoload: true }),
};

// Promisify NeDB operations
function dbFind(store, query, sort = {}, limit = 0) {
  return new Promise((resolve, reject) => {
    let cursor = store.find(query).sort(sort);
    if (limit > 0) cursor = cursor.limit(limit);
    cursor.exec((err, docs) => err ? reject(err) : resolve(docs));
  });
}
function dbFindOne(store, query) {
  return new Promise((resolve, reject) => store.findOne(query, (err, doc) => err ? reject(err) : resolve(doc)));
}
function dbInsert(store, doc) {
  return new Promise((resolve, reject) => store.insert(doc, (err, newDoc) => err ? reject(err) : resolve(newDoc)));
}
function dbUpdate(store, query, update, options = {}) {
  return new Promise((resolve, reject) => store.update(query, update, options, (err, n) => err ? reject(err) : resolve(n)));
}
function dbCount(store, query) {
  return new Promise((resolve, reject) => store.count(query, (err, n) => err ? reject(err) : resolve(n)));
}
function dbRemove(store, query, options = {}) {
  return new Promise((resolve, reject) => store.remove(query, options, (err, n) => err ? reject(err) : resolve(n)));
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── File Upload Setup ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const leadId = req.params.leadId || req.body.leadId || 'temp';
    const dir = path.join(uploadDir, leadId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 20) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpeg|jpg|png|gif|webp|heic)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ─── Email Setup ──────────────────────────────────────────────────────────────
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`[EMAIL SKIPPED - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'United Group Restoration <noreply@unitedgrouprestoration.com>',
      to, subject, html
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

// ─── Claude AI Setup ──────────────────────────────────────────────────────────
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-key')) {
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are a helpful customer support assistant for United Group Restoration, a professional storm damage restoration company.

Your role is to:
- Answer questions about storm damage (roof, siding, interior, hail, wind, water)
- Explain the restoration process and what customers can expect
- Provide general timelines for inspections and repairs
- Help customers understand insurance claims for storm damage
- Encourage customers to schedule a free inspection

Key information:
- We offer FREE inspection quotes with no obligation
- We handle insurance claims directly with most major carriers
- Services: roof replacement/repair, siding restoration, interior water damage, gutters
- We respond within 24 hours for emergency situations
- We serve the greater metropolitan area

If a question is too specific (pricing, availability, specific contractor info), say:
"That's a great question! For specific details, I'd recommend speaking directly with one of our specialists. You can reach us through our contact form or by booking a free inspection."

Keep responses concise, helpful, and professional. Do not make specific promises about pricing or timelines.`;

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Leads ---
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, address, damage_description, service_type, contact_method } = req.body;
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ error: 'Name, email, phone, and address are required' });
    }

    const lead = {
      _id: uuidv4(),
      name, email, phone, address,
      damage_description: damage_description || '',
      service_type: service_type || 'other',
      contact_method: contact_method || 'email',
      status: 'new',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await dbInsert(db.leads, lead);

    // Notify admin
    await sendEmail(
      process.env.LEAD_NOTIFY_EMAIL || process.env.SMTP_USER,
      `New Lead: ${name} - ${service_type || 'General'}`,
      `<h2>New Lead</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Address:</strong> ${address}</p><p><strong>Service:</strong> ${service_type}</p><p><strong>Damage:</strong> ${damage_description}</p><p><strong>Lead ID:</strong> ${lead._id}</p>`
    );

    // Confirm to customer
    await sendEmail(email, 'Inspection Request Received - United Group Restoration',
      `<h2>Thank you, ${name}!</h2><p>We received your inspection request. Our team will contact you within <strong>24 hours</strong>.</p><p>Reference: <strong>${lead._id.substring(0,8).toUpperCase()}</strong></p>`
    );

    res.status(201).json({ success: true, leadId: lead._id });
  } catch (err) {
    console.error('Lead creation error:', err);
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const { status, search, limit = 100, offset = 0 } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ name: re }, { email: re }, { phone: re }, { address: re }];
    }

    const allDocs = await dbFind(db.leads, query, { created_at: -1 });
    const total = allDocs.length;
    const leads = allDocs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    res.json({ leads, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

app.get('/api/leads/export/csv', async (req, res) => {
  try {
    const leads = await dbFind(db.leads, {}, { created_at: -1 });
    const headers = ['ID','Name','Email','Phone','Address','Service Type','Damage Description','Contact Method','Status','Notes','Created At'];
    const rows = leads.map(l => [
      l._id, l.name, l.email, l.phone, l.address,
      l.service_type, `"${(l.damage_description || '').replace(/"/g, '""')}"`,
      l.contact_method, l.status,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.created_at
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await dbFindOne(db.leads, { _id: req.params.id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const photos = await dbFind(db.photos, { lead_id: req.params.id });
    const bookings = await dbFind(db.bookings, { lead_id: req.params.id });
    res.json({ ...lead, id: lead._id, photos, bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load lead' });
  }
});

app.patch('/api/leads/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['new', 'contacted', 'booked', 'quoted', 'closed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await dbUpdate(db.leads, { _id: req.params.id }, { $set: { status, notes: notes || '', updated_at: new Date().toISOString() } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// --- Photos ---
app.post('/api/leads/:leadId/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const { leadId } = req.params;
    const { category } = req.body;
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });

    const saved = [];
    for (const file of req.files) {
      const photo = {
        _id: uuidv4(),
        lead_id: leadId,
        filename: file.filename,
        original_name: file.originalname,
        category: category || 'general',
        size: file.size,
        created_at: new Date().toISOString()
      };
      await dbInsert(db.photos, photo);
      saved.push({ id: photo._id, filename: file.filename, originalName: file.originalname, size: file.size });
    }
    res.json({ success: true, photos: saved });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/uploads/:leadId/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.leadId, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

app.post('/api/photos/temp', upload.array('photos', 10), async (req, res) => {
  try {
    const tempId = `temp-${uuidv4()}`;
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });
    const saved = req.files.map(f => ({ filename: f.filename, originalName: f.originalname, size: f.size }));
    res.json({ success: true, tempId, photos: saved });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// --- Bookings ---
const ALL_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, address, date, time_slot, notes, lead_id } = req.body;
    if (!name || !email || !phone || !date || !time_slot) {
      return res.status(400).json({ error: 'Name, email, phone, date, and time slot are required' });
    }

    // Check conflict
    const existing = await dbFindOne(db.bookings, { date, time_slot, status: { $ne: 'cancelled' } });
    if (existing) return res.status(409).json({ error: 'This time slot is already booked' });

    const booking = {
      _id: uuidv4(),
      lead_id: lead_id || null,
      name, email, phone,
      address: address || '',
      date, time_slot,
      notes: notes || '',
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    await dbInsert(db.bookings, booking);

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    await sendEmail(
      process.env.LEAD_NOTIFY_EMAIL || process.env.SMTP_USER,
      `Inspection Booked: ${name} on ${formattedDate} at ${time_slot}`,
      `<h2>Booking Confirmed</h2><p><strong>Customer:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Date:</strong> ${formattedDate} at ${time_slot}</p><p><strong>Address:</strong> ${address}</p>`
    );

    await sendEmail(email, `Inspection Confirmed: ${formattedDate} at ${time_slot}`,
      `<h2>Your Inspection is Confirmed!</h2><p>Hi ${name},</p><p><strong>📅 Date:</strong> ${formattedDate}</p><p><strong>🕐 Time:</strong> ${time_slot}</p><p><strong>📍 Address:</strong> ${address || 'To be confirmed'}</p><p>Booking ref: <strong>${booking._id.substring(0,8).toUpperCase()}</strong></p>`
    );

    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to book inspection' });
  }
});

app.get('/api/bookings/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.json({ slots: ALL_SLOTS });
    const booked = await dbFind(db.bookings, { date, status: { $ne: 'cancelled' } });
    const bookedSet = new Set(booked.map(b => b.time_slot));
    const available = ALL_SLOTS.filter(s => !bookedSet.has(s));
    res.json({ slots: available, bookedCount: bookedSet.size });
  } catch (err) {
    res.json({ slots: ALL_SLOTS });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await dbFind(db.bookings, {}, { date: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// --- Chat ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const sid = sessionId || uuidv4();

    // Save user message
    await dbInsert(db.chat, { _id: uuidv4(), session_id: sid, role: 'user', content: message, created_at: new Date().toISOString() });

    // Get history (last 10)
    const history = await dbFind(db.chat, { session_id: sid }, { created_at: 1 });
    const recent = history.slice(-10);

    let reply;

    if (!anthropic) {
      reply = "Thank you for your question! Our AI assistant is warming up — our team is standing by. Please fill out our contact form or book a free inspection and we'll get back to you within 24 hours.";
    } else {
      const messages = recent.map(h => ({ role: h.role, content: h.content }));
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages
      });
      reply = response.content[0].text;
    }

    await dbInsert(db.chat, { _id: uuidv4(), session_id: sid, role: 'assistant', content: reply, created_at: new Date().toISOString() });
    res.json({ reply, sessionId: sid });
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      reply: "I'm having a moment of trouble. Reach out through our contact form — we'll respond fast!",
      sessionId: req.body.sessionId || uuidv4()
    });
  }
});

// --- Stats ---
app.get('/api/stats', async (req, res) => {
  try {
    const total = await dbCount(db.leads, {});
    const bookingsTotal = await dbCount(db.bookings, {});
    const allLeads = await dbFind(db.leads, {});
    const statusCounts = {};
    allLeads.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    const recentLeads = await dbFind(db.leads, {}, { created_at: -1 });
    res.json({ total, byStatus, bookingsTotal, recentLeads: recentLeads.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

// ─── Start Server (HTTP or HTTPS) ─────────────────────────────────────────────
const https = require('https');
// Only start server if running locally (not on Vercel)
if (!process.env.VERCEL) {
  const http  = require('http');
  const https = require('https');

  const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.USE_HTTPS === '1';
  const CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, 'certs', 'cert.pem');
  const KEY_PATH  = process.env.SSL_KEY_PATH  || path.join(__dirname, 'certs', 'key.pem');

  function banner(scheme) {
    console.log(`
  ╔════════════════════════════════════════════╗
  ║   United Group Inc. — Web Server          ║
  ║   ${scheme}://localhost:${PORT}${' '.repeat(Math.max(0, 25 - scheme.length - String(PORT).length))}║
  ║                                            ║
  ║   Landing:  ${scheme}://localhost:${PORT}/${' '.repeat(Math.max(0, 18 - scheme.length - String(PORT).length))}║
  ║   Admin:    ${scheme}://localhost:${PORT}/admin.html${' '.repeat(Math.max(0, 8 - scheme.length - String(PORT).length))}║
  ╚════════════════════════════════════════════╝
  `);
  }

  if (USE_HTTPS && fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
    const opts = {
      cert: fs.readFileSync(CERT_PATH),
      key:  fs.readFileSync(KEY_PATH)
    };
    https.createServer(opts, app).listen(PORT, () => banner('https'));
  } else {
    if (USE_HTTPS) {
      console.warn('[!] USE_HTTPS=true but cert/key not found at:', CERT_PATH, KEY_PATH);
      console.warn('    Falling back to HTTP. Run: node scripts/gen-cert.js');
    }
    http.createServer(app).listen(PORT, () => banner('http'));
  }
}

module.exports = app;
