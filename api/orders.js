const { db, send } = require("./_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  try {
    const b = req.body || {};
    const name = String(b.customer_name || "").trim();
    const phone = String(b.contact_phone || "").trim();
    const email = String(b.customer_email || "").trim();
    const service = String(b.service || "").trim();
    const description = String(b.description || "").trim();
    if (name.length < 2 || name.length > 100 || phone.length < 8 || phone.length > 30 || service.length < 2 || service.length > 120 || description.length < 2 || description.length > 2000 || email.length > 160)
      return send(res, 400, { error: "Confira os campos e tente novamente." });
    const { rows } = await db().query(
      "INSERT INTO orders(customer_name,contact_phone,customer_email,service,description) VALUES($1,$2,$3,$4,$5) RETURNING order_number",
      [name, phone, email || null, service, description]
    );
    return send(res, 201, { order_number: rows[0].order_number });
  } catch (e) {
    console.error("order create failed", e.message);
    return send(res, 500, { error: "Não foi possível registrar o pedido agora." });
  }
};