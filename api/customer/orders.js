const { db, send, getCustomerSession } = require("../_lib");
module.exports = async (req, res) => {
  const customer = getCustomerSession(req);
  if (!customer) return send(res, 401, { error: "Entre na sua conta para continuar." });
  try {
    if (req.method === "GET") {
      const { rows } = await db().query(
        "SELECT id,order_number,service,description,status,cancellation_status,cancellation_requested_at,cancellation_reviewed_at,created_at,updated_at FROM orders WHERE customer_user_id=$1 ORDER BY created_at DESC LIMIT 100",
        [customer.id]
      );
      return send(res, 200, { orders: rows });
    }
    if (req.method === "POST") {
      const b = req.body || {};
      const service = String(b.service || "").trim();
      const description = String(b.description || "").trim();
      const phone = String(b.phone || "").trim() || "Não informado";
      const key = String(b.attachment_key || "").trim();
      const name = String(b.attachment_name || "").trim().slice(0, 255);
      const contentType = String(b.attachment_content_type || "");
      const size = Number(b.attachment_size || 0);
      if (service.length < 2 || service.length > 120 || description.length < 2 || description.length > 2000)
        return send(res, 400, { error: "Informe o tipo de serviço e os detalhes do pedido." });
      if (key && (!key.startsWith(customer.id + "/") || !/^[^\s]+\.(jpg|png|webp)$/i.test(key) ||
          !["image/jpeg","image/png","image/webp"].includes(contentType) ||
          !Number.isInteger(size) || size < 1 || size > 4 * 1024 * 1024 || !name))
        return send(res, 400, { error: "O anexo enviado não é válido. Selecione a foto novamente." });
      const { rows } = await db().query(
        "INSERT INTO orders(customer_user_id,customer_name,contact_phone,customer_email,service,description,attachment_key,attachment_name,attachment_content_type,attachment_size) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING order_number",
        [customer.id, customer.name, phone, customer.email, service, description, key || null, key ? name : null, key ? contentType : null, key ? size : null]
      );
      return send(res, 201, { order_number: rows[0].order_number });
    }
    return send(res, 405, { error: "Método não permitido." });
  } catch (error) {
    console.error("customer orders failed", error.message);
    return send(res, 500, { error: "Não foi possível processar seus pedidos agora." });
  }
};
