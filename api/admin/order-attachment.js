const { db, send, requireAdmin } = require("../_lib");
const { signObject } = require("../_storage");
module.exports = async (req, res) => {
  if (req.method !== "GET") return send(res, 405, { error: "Método não permitido." });
  if (!requireAdmin(req, res)) return;
  const id = String(req.query?.id || "").trim();
  if (!id) return send(res, 400, { error: "Pedido inválido." });
  try {
    const { rows } = await db().query("SELECT attachment_key, attachment_name FROM orders WHERE id=$1 LIMIT 1", [id]);
    if (!rows.length || !rows[0].attachment_key) return send(res, 404, { error: "Este pedido não possui foto anexada." });
    const url = signObject("GET", rows[0].attachment_key, "", 300, rows[0].attachment_name || "foto-do-pedido");
    return send(res, 200, { url });
  } catch (error) {
    console.error("admin order attachment download failed:", error.message);
    return send(res, 500, { error: "Não foi possível preparar o download da foto." });
  }
};
