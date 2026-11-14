const { send } = require("../_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  res.setHeader("Set-Cookie", "pv_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
  return send(res, 200, { ok: true });
};