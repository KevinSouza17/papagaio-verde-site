const { send, safeEqual, makeSession, cookieSecure } = require("../_lib");

function normalizeIdentifier(value) {
  const raw = String(value || "").trim().toLowerCase();
  return { raw, digits: raw.replace(/\\D/g, "") };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });

  const identifier = normalizeIdentifier(req.body?.identifier || req.body?.email);
  const configured = normalizeIdentifier(process.env.ADMIN_LOGIN || process.env.ADMIN_EMAIL);
  const password = String(req.body?.password || "");

  if (!configured.raw || !process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return send(res, 503, { error: "A conta oficial ainda não foi configurada pelo responsável técnico." });
  }
  const identifierMatches = identifier.raw === configured.raw ||
    (identifier.digits.length > 0 && configured.digits.length > 0 && identifier.digits === configured.digits);
  if (!identifierMatches || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return send(res, 401, { error: "Identificação ou senha inválida." });
  }

  try {
    const token = makeSession("papagaio-verde");
    const secure = cookieSecure(req) ? "; Secure" : "";
    res.setHeader("Set-Cookie", "pv_admin=" + token + "; HttpOnly" + secure + "; SameSite=Lax; Path=/; Max-Age=28800");
    return send(res, 200, { ok: true, account: "Papagaio Verde" });
  } catch (error) {
    console.error("admin login configuration failed:", error.message);
    return send(res, 503, { error: "Não foi possível iniciar uma sessão segura. Confira a configuração." });
  }
};
