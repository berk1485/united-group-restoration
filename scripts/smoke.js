const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const port = 4799;
const env = Object.assign({}, process.env, { PORT: String(port) });
const proc = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let out = ''; proc.stdout.on('data', d => out += d); proc.stderr.on('data', d => out += d);

const get = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p, timeout: 4000 }, (r) => {
    let buf = ''; r.on('data', c => buf += c); r.on('end', () => res({ status: r.statusCode, len: buf.length, body: buf }));
  }).on('error', rej);
});

setTimeout(async () => {
  try {
    const idx = await get('/');
    const anim = await get('/animations.js');
    console.log(JSON.stringify({
      index: { status: idx.status, len: idx.len, gsap: /gsap/i.test(idx.body), heroData: /data-hero-line/.test(idx.body), scrollProgress: /scroll-progress/.test(idx.body) },
      animations: { status: anim.status, len: anim.len, hasScrollTrigger: /ScrollTrigger/.test(anim.body) }
    }, null, 2));
  } catch (e) {
    console.error('FAIL', e.message, '\nserver out:\n', out.slice(0, 1000));
    process.exitCode = 1;
  } finally {
    proc.kill();
  }
}, 1800);
