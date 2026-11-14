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
  const identifier = String(req.body?.identifier || req.body?.email || "").trim();
  const email = identifier.toLowerCase();
  const cnpj = identifier.replace(/\D/g, "");
  const password = String(req.body?.password || "");
  if (!identifier || !password) return send(res, 400, { error: "Informe seu CNPJ ou e-mail e sua senha." });
  const adminId = String(process.env.ADMIN_EMAIL || "").replace(/\D/g, "");
  if (adminId && process.env.ADMIN_PASSWORD && cnpj === adminId && safeEqual(password, process.env.ADMIN_PASSWORD)) {
    const token = makeSession("admin:" + adminId);
    res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800");
    return send(res, 200, { ok: true });
  }
  try {
    const { rows } = await db().query("SELECT email,password_hash FROM staff_users WHERE email=$1 AND active=true LIMIT 1", [email]);
    if (!rows.length || !verifyPassword(password, rows[0].password_hash))
      return send(res, 401, { error: "CNPJ/e-mail ou senha inválidos." });
    const token = makeSession(rows[0].email);
    res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800");
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error("admin login failed", e.message);
    return send(res, 500, { error: "Falha ao acessar o banco. Confira a conexão e tente novamente." });
  }
};