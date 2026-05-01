#!/usr/bin/env node
/**
 * Generate a self-signed cert for local HTTPS testing.
 * Output: ./certs/cert.pem and ./certs/key.pem
 *
 * Production: replace these with real certs from Let's Encrypt or your hosting
 * provider. Most modern hosts (Render, Vercel, Fly, Railway, DigitalOcean App
 * Platform, Heroku) provision and renew certs automatically — you don't need
 * USE_HTTPS=true on those platforms; just bind to PORT and they handle TLS at
 * the edge.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const certDir = path.join(__dirname, "..", "certs");
fs.mkdirSync(certDir, { recursive: true });

const certPath = path.join(certDir, "cert.pem");
const keyPath  = path.join(certDir, "key.pem");

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log("Certs already exist:", certPath);
  console.log("Delete them first if you want to regenerate.");
  process.exit(0);
}

try {
  execSync("openssl version", { stdio: "ignore" });
} catch {
  console.error("ERROR: openssl is required but not found in PATH.");
  console.error("Windows: install Git Bash or OpenSSL for Windows.");
  console.error("macOS:   brew install openssl");
  console.error("Linux:   apt-get install openssl  (or your distro's package)");
  process.exit(1);
}

const subj = "/C=US/ST=NJ/L=Westville/O=United Group Inc./CN=localhost";
console.log("Generating self-signed cert (valid 365 days)...");
execSync(
  `openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyPath}" -out "${certPath}" -days 365 -subj "${subj}" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`,
  { stdio: "inherit" }
);

console.log("\n✓ Wrote:", certPath);
console.log("✓ Wrote:", keyPath);
console.log("\nStart the server with HTTPS:");
console.log("  USE_HTTPS=true npm start          # macOS/Linux");
console.log("  $env:USE_HTTPS='true'; npm start  # PowerShell");
console.log("\nThen open: https://localhost:3000");
console.log("(Browser will warn about self-signed cert — that's expected.)");
