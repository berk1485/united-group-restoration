// API routes disabled on Vercel (NeDB doesn't work serverless)
// These will return "coming soon" messages

app.post('/api/lead', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Lead capture coming soon. Call us at 856-254-8367',
    phone: '856-254-8367'
  });
});

app.post('/api/photo', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Photo upload coming soon. Email photos to: info@unitedgroup.local'
  });
});

app.post('/api/booking', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Booking calendar coming soon. Call 856-254-8367 to schedule'
  });
});

app.post('/api/chat', (req, res) => {
  res.json({ 
    reply: 'Chat support is currently offline. Call us at 856-254-8367 for immediate assistance.',
    sessionId: req.body.sessionId
  });
});

app.get('/api/stats', (req, res) => {
  res.json({ leads: 0, bookings: 0, statuses: {} });
});

app.get('/admin.html', (req, res) => {
  res.status(503).send('Admin dashboard is offline. Use local version instead.');
});
