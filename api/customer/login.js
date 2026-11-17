const { db, send, makeCustomerSession } = require("../_lib");
const { scryptSync, timingSafeEqual } = require("node:crypto");
function verify(password,stored){try{const [salt,expected]=String(stored).split(":");const actual=scryptSync(String(password),salt,64).toString("hex");const a=Buffer.from(actual,"hex"),b=Buffer.from(expected,"hex");return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
module.exports=async(req,res)=>{
 if(req.method!=="POST")return send(res,405,{error:"Método não permitido."});
 const email=String(req.body?.email||"").trim().toLowerCase(),password=String(req.body?.password||"");
 if(!email||!password)return send(res,400,{error:"Informe e-mail e senha."});
 try{
  const {rows}=await db().query("SELECT id,full_name,email,phone,password_hash FROM customers WHERE email=$1 AND active=true LIMIT 1",[email]);
  if(!rows.length||!verify(password,rows[0].password_hash))return send(res,401,{error:"E-mail ou senha inválidos."});
  const c=rows[0],token=makeCustomerSession(c);
  res.setHeader("Set-Cookie","pv_customer="+token+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000");
  return send(res,200,{ok:true,customer:{full_name:c.full_name,email:c.email,phone:c.phone}});
 }catch(e){console.error("customer login failed",e.message);return send(res,500,{error:"Não foi possível entrar agora."})}
};