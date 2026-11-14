const { db, send, safeEqual, makeSession } = require("../_lib");
const { scryptSync, timingSafeEqual } = require("node:crypto");
function verifyPassword(password, stored) {
  try {
    const [salt, expected] = String(stored).split(":");
    const actual = scryptSync(String(password), salt, 64).toString("hex");
    const a = Buffer.from(actual, "hex"), b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) return send(res, 400, { error: "Informe e-mail e senha." });
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
      safeEqual(email, process.env.ADMIN_EMAIL.trim().toLowerCase()) &&
      safeEqual(password, process.env.ADMIN_PASSWORD)) {
    const token = makeSession(email);
    res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
    return send(res, 200, { ok: true });
  }
  try {
    const { rows } = await db().query("SELECT email,password_hash FROM staff_users WHERE email=$1 AND active=true LIMIT 1", [email]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash))
      return send(res, 401, { error: "E-mail ou senha inválidos." });
    const token = makeSession(rows[0].email);
    res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("admin login failed", e.message);
    return send(res, 500, { error: "Não foi possível entrar. Tente novamente." });
  }
};