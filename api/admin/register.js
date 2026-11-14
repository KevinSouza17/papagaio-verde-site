const { db, send, safeEqual } = require("../_lib");
const { randomBytes, scryptSync } = require("node:crypto");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const fullName = String(req.body?.full_name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const inviteCode = String(req.body?.invite_code || "");
  if (!process.env.ADMIN_PASSWORD || !safeEqual(inviteCode, process.env.ADMIN_PASSWORD))
    return send(res, 403, { error: "Código de convite inválido. Solicite o código ao responsável pela loja." });
  if (fullName.length < 2 || fullName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 || password.length < 10 || password.length > 200)
    return send(res, 400, { error: "Confira nome, e-mail e senha (mínimo de 10 caracteres)." });
  try {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    await db().query("INSERT INTO staff_users(full_name,email,password_hash) VALUES($1,$2,$3)", [fullName,email,salt+":"+hash]);
    return send(res, 201, { ok: true });
  } catch (e) {
    if (e.code === "23505") return send(res, 409, { error: "Já existe uma conta com esse e-mail." });
    console.error("admin registration failed", e.message);
    return send(res, 500, { error: "Não foi possível criar a conta agora." });
  }
};