const { send, getSession } = require("../_lib");
module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Método não permitido." });
  const session = getSession(req);
  return send(res, 200, { authenticated: !!session, email: session?.email || null });
};