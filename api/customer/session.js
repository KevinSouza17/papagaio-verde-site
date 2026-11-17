const { send, getCustomerSession } = require("../_lib");
module.exports=async(req,res)=>{
 if(req.method!=="GET")return send(res,405,{error:"Método não permitido."});
 const s=getCustomerSession(req);
 return send(res,200,{authenticated:!!s,customer:s?{full_name:s.name,email:s.email}:null});
};