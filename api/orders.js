const { db, send, getCustomerSession } = require("./_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  try {
    const customer = getCustomerSession(req);
    if (!customer?.id) return send(res, 401, { error: "Entre na sua conta para enviar um pedido." });
    const b = req.body || {};
    const name = String(b.customer_name || customer.name || "").trim();
    const phone = String(b.contact_phone || customer.phone || "").trim();
    const email = String(b.customer_email || customer.email || "").trim();
    const service = String(b.service || "").trim();
    const description = String(b.description || "").trim();
    if (name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 30 || service.length < 2 || service.length > 120 || description.length < 2 || description.length > 2000 || email.length > 160)
      return send(res, 400, { error: "Confira os campos e tente novamente." });
    const { rows } = await db().query(
      "INSERT INTO orders(customer_user_id,customer_name,contact_phone,customer_email,service,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING order_number",
      [customer.id, name, phone, email || null, service, description]
    );
    return send(res, 201, { order_number: rows[0].order_number });
  } catch (e) {
    console.error("order create failed", e.message);
    return send(res, 500, { error: "Não foi possível registrar o pedido agora." });
  }
};