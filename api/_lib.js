const { Pool } = require("pg");
const { createHmac, timingSafeEqual } = require("node:crypto");
const { getDatabaseConfig } = require("../config/database");

let pool;

function db() {
  if (!pool) {
    pool = new Pool(getDatabaseConfig());
    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error.message);
    });
  }
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
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurada.");
  return createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}
function makeSession(identity) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurada.");
  const payload = Buffer.from(JSON.stringify({ identity, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}
function makeCustomerSession(customer) {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurada.");
  const payload = Buffer.from(JSON.stringify({ id: customer.id, email: customer.email, name: customer.full_name, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}
function readCookie(req, name) {
  const cookies = (req.headers.cookie || "").split(";").map(v => v.trim());
  return cookies.find(v => v.startsWith(name + "="))?.slice(name.length + 1);
}
function decodeSession(token) {
  try {
    if (!token || !process.env.SESSION_SECRET) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
function getCustomerSession(req) { return decodeSession(readCookie(req, "pv_customer")); }
function getSession(req) {
  const session = decodeSession(readCookie(req, "pv_admin"));
  return session?.identity === "papagaio-verde" ? session : null;
}
function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session) { send(res, 401, { error: "Sessão expirada. Entre novamente." }); return null; }
  return session;
}
function cookieSecure(req) {
  return process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https";
}
module.exports = { db, send, safeEqual, makeSession, getSession, makeCustomerSession, getCustomerSession, requireAdmin, cookieSecure };
