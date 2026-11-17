const { db, send, getCustomerSession } = require("../_lib");
module.exports=async(req,res)=>{
 const customer=getCustomerSession(req);
 if(!customer)return send(res,401,{error:"Entre na sua conta para continuar."});
 try{
  if(req.method==="GET"){
   const {rows}=await db().query("SELECT id,order_number,service,description,status,cancellation_status,cancellation_requested_at,cancellation_reviewed_at,created_at,updated_at FROM orders WHERE customer_user_id=$1 ORDER BY created_at DESC LIMIT 100",[customer.id]);
   return send(res,200,{orders:rows});
  }
  if(req.method==="POST"){
   const b=req.body||{},service=String(b.service||"").trim(),description=String(b.description||"").trim();
   if(service.length<2||service.length>120||description.length<2||description.length>2000)return send(res,400,{error:"Informe o tipo de serviço e os detalhes do pedido."});
   const {rows}=await db().query("INSERT INTO orders(customer_user_id,customer_name,contact_phone,customer_email,service,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING order_number",[customer.id,customer.name,String(b.phone||"").trim()||"Não informado",customer.email,service,description]);
   return send(res,201,{order_number:rows[0].order_number});
  }
  return send(res,405,{error:"Método não permitido."});
 }catch(e){console.error("customer orders failed",e.message);return send(res,500,{error:"Não foi possível processar seus pedidos agora."})}
};