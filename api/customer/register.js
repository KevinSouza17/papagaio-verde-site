const { db, send } = require("../_lib");
const { randomBytes, scryptSync } = require("node:crypto");
module.exports = async (req,res) => {
  if(req.method!=="POST") return send(res,405,{error:"Método não permitido."});
  const b=req.body||{}, name=String(b.full_name||"").trim(), email=String(b.email||"").trim().toLowerCase(), phone=String(b.phone||"").trim(), password=String(b.password||"");
  if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160||phone.replace(/\D/g,"").length<10||phone.length>30||password.length<10||password.length>200)
    return send(res,400,{error:"Confira os dados. A senha precisa ter pelo menos 10 caracteres."});
  try {
    const salt=randomBytes(16).toString("hex"), hash=scryptSync(password,salt,64).toString("hex");
    await db().query("INSERT INTO customers(full_name,email,phone,password_hash) VALUES($1,$2,$3,$4)",[name,email,phone,salt+":"+hash]);
    return send(res,201,{ok:true});
  } catch(e) {
    if(e.code==="23505") return send(res,409,{error:"Já existe uma conta com esse e-mail."});
    console.error("customer register failed",e.message); return send(res,500,{error:"Não foi possível criar sua conta agora."});
  }
};