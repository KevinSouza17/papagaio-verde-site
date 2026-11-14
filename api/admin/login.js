const { send, safeEqual, makeSession } = require("../_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const { email, password } = req.body || {};
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)
    return send(res, 503, { error: "Configure ADMIN_EMAIL, ADMIN_PASSWORD e SESSION_SECRET nas variáveis do Vercel." });
  if (!safeEqual(String(email || "").trim().toLowerCase(), process.env.ADMIN_EMAIL.trim().toLowerCase()) || !safeEqual(password, process.env.ADMIN_PASSWORD))
    return send(res, 401, { error: "E-mail ou senha inválidos." });
  const token = makeSession(process.env.ADMIN_EMAIL);
  res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
  return send(res, 200, { ok: true });
};