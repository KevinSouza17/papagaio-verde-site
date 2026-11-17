const { Pool } = require("pg");
const { createHmac, timingSafeEqual } = require("node:crypto");

let pool;

function getDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL não configurada.");

  // Neon and self-hosted PostgreSQL use the same pg driver.
  // Use verify-full for cloud databases and disable only for a trusted local network.
  const sslMode = String(process.env.DATABASE_SSL || "verify-full").toLowerCase();
  const allowedModes = new Set(["disable", "require", "verify-full"]);
  if (!allowedModes.has(sslMode)) {
    throw new Error("DATABASE_SSL deve ser disable, require ou verify-full.");
  }

  let connectionString = rawUrl;
  if (/[?&]sslmode=/i.test(connectionString)) {
    connectionString = connectionString.replace(/([?&])sslmode=[^&]*/i, "$1sslmode=" + sslMode);
  } else {
    connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=" + sslMode;
  }

  const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX || "5", 10);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 30) {
    throw new Error("DATABASE_POOL_MAX deve ser um número entre 1 e 30.");
  }

  const ssl = sslMode === "disable"
    ? false
    : { rejectUnauthorized: sslMode === "verify-full" };

  return {
    connectionString,
    ssl,
    max: poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true
  };
}

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
