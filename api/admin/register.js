const { send } = require("../_lib");

// Administrative identities are provisioned only through the protected deployment
// environment. Public registration is intentionally and permanently disabled.
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  res.setHeader("Allow", "POST");
  return send(res, 410, { error: "O cadastro de administradores está desativado. Papagaio Verde é a única conta administrativa." });
};
