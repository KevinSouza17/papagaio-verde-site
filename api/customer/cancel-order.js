const { db, send, getCustomerSession } = require("./_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const customer = getCustomerSession(req);
  if (!customer) return send(res, 401, { error: "Entre na sua conta para continuar." });
  const id = String((req.body || {}).order_id || "").trim();
  if (!id) return send(res, 400, { error: "Pedido inválido." });
  try {
    const { rows } = await db().query(
      "UPDATE orders SET cancellation_status='pending', cancellation_requested_at=now() WHERE id=$1 AND customer_user_id=$2 AND status NOT IN ('delivered','cancelled') AND cancellation_status IN ('none','rejected') RETURNING id,order_number,cancellation_status,cancellation_requested_at",
      [id, customer.id]
    );
    if (!rows.length) return send(res, 409, { error: "Não foi possível solicitar o cancelamento. Confira se o pedido ainda pode ser cancelado ou se já existe uma solicitação em análise." });
    return send(res, 200, { order: rows[0], message: "Solicitação enviada. Aguarde a análise da loja." });
  } catch (e) {
    console.error("customer cancellation request failed", e.message);
    return send(res, 500, { error: "Não foi possível solicitar o cancelamento agora." });
  }
};
