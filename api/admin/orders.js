const { db, send, requireAdmin } = require("../_lib");
const statuses = ["received","reviewing","awaiting_approval","in_production","ready","delivered","cancelled"];
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === "GET") {
      const { rows } = await db().query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500");
      return send(res, 200, { orders: rows });
    }
    if (req.method === "PATCH") {
      const { id, status, note } = req.body || {};
      if (!id || !statuses.includes(status)) return send(res, 400, { error: "Atualização inválida." });
      const client = await db().connect();
      try {
        await client.query("BEGIN");
        const result = await client.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING *", [status, id]);
        if (!result.rowCount) { await client.query("ROLLBACK"); return send(res, 404, { error: "Pedido não encontrado." }); }
        if (String(note || "").trim()) {
          await client.query("UPDATE order_status_history SET note=$1, changed_by=$2 WHERE id=(SELECT id FROM order_status_history WHERE order_id=$3 AND new_status=$4 ORDER BY created_at DESC,id DESC LIMIT 1)", [String(note).trim().slice(0,500), process.env.ADMIN_EMAIL || "equipe", id, status]);
        }
        await client.query("COMMIT");
        return send(res, 200, { order: result.rows[0] });
      } catch (e) { await client.query("ROLLBACK"); throw e; }
      finally { client.release(); }
    }
    return send(res, 405, { error: "Método não permitido." });
  } catch (e) {
    console.error("admin orders failed", e.message);
    return send(res, 500, { error: "Não foi possível processar os pedidos." });
  }
};