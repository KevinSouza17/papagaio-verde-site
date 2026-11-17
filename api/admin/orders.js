const { db, send, requireAdmin } = require("../_lib");
const { signObject } = require("../_storage");
const statuses = ["received","reviewing","awaiting_approval","in_production","ready","delivered","cancelled"];
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === "GET") {
      if (req.query?.download_attachment === "1") {
        const id = String(req.query.id || "").trim();
        if (!id) return send(res, 400, { error: "Pedido inválido." });
        const { rows } = await db().query("SELECT attachment_key, attachment_name FROM orders WHERE id=$1 LIMIT 1", [id]);
        if (!rows.length || !rows[0].attachment_key) return send(res, 404, { error: "Este pedido não possui foto anexada." });
        return send(res, 200, { url: signObject("GET", rows[0].attachment_key, "", 300, rows[0].attachment_name || "foto-do-pedido") });
      }
      const { rows } = await db().query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500");
      return send(res, 200, { orders: rows });
    }
    if (req.method === "PATCH") {
      const { id, status, note, cancellation_decision } = req.body || {};
      if (!id) return send(res, 400, { error: "Pedido inválido." });
      if (cancellation_decision) {
        if (!["approved", "rejected"].includes(cancellation_decision))
          return send(res, 400, { error: "Decisão de cancelamento inválida." });
        const client = await db().connect();
        try {
          await client.query("BEGIN");
          const current = await client.query("SELECT cancellation_status FROM orders WHERE id=$1 FOR UPDATE", [id]);
          if (!current.rowCount || current.rows[0].cancellation_status !== "pending") {
            await client.query("ROLLBACK");
            return send(res, 409, { error: "Esta solicitação já foi analisada ou não existe." });
          }
          const result = await client.query(
            "UPDATE orders SET cancellation_status=$1, cancellation_reviewed_at=now(), status=CASE WHEN $1='approved' THEN 'cancelled' ELSE status END WHERE id=$2 RETURNING *",
            [cancellation_decision, id]
          );
          const cleanNote = String(note || "").trim().slice(0, 500);
          if (cleanNote && cancellation_decision === "approved") {
            await client.query(
              "UPDATE order_status_history SET note=$1, changed_by=$2 WHERE id=(SELECT id FROM order_status_history WHERE order_id=$3 AND new_status='cancelled' ORDER BY created_at DESC,id DESC LIMIT 1)",
              [cleanNote, process.env.ADMIN_EMAIL || "equipe", id]
            );
          }
          await client.query("COMMIT");
          return send(res, 200, { order: result.rows[0], message: cancellation_decision === "approved" ? "Cancelamento aprovado." : "Cancelamento recusado." });
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      }
      if (!statuses.includes(status)) return send(res, 400, { error: "Atualização inválida." });
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
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    }
    return send(res, 405, { error: "Método não permitido." });
  } catch (error) {
    console.error("admin orders failed", error.message);
    return send(res, 500, { error: "Não foi possível processar os pedidos." });
  }
};
