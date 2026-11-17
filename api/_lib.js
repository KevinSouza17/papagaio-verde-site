const { Pool } = require("pg");
const { createHmac, timingSafeEqual } = require("node:crypto");

let pool;
function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true }, max: 5 });
  return pool;
}
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
}
function sign(value) {
  return createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}
function makeSession(email) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurada.");
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}
function makeCustomerSession(customer) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurada.");
  const payload = Buffer.from(JSON.stringify({ id: customer.id, email: customer.email, name: customer.full_name, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}
function getCustomerSession(req) {
  try {
    if (!process.env.SESSION_SECRET) return null;
    const cookies = (req.headers.cookie || "").split(";").map(v => v.trim());
    const token = cookies.find(v => v.startsWith("pv_customer="))?.slice(12);
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function getSession(req) {
  try {
    if (!process.env.SESSION_SECRET) return null;
    const cookies = (req.headers.cookie || "").split(";").map(v => v.trim());
    const token = cookies.find(v => v.startsWith("pv_admin="))?.slice(9);
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session) { send(res, 401, { error: "Sessão expirada. Entre novamente." }); return null; }
  return session;
}
module.exports = { db, send, safeEqual, makeSession, getSession, makeCustomerSession, getCustomerSession, requireAdmin };