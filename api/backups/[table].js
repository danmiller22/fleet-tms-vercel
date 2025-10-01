
const { getAdmin } = require('../../_lib/supabaseAdmin');
module.exports=async(req,res)=>{
 try{
  const {table}=req.query; const supa=getAdmin();
  const {data,error}=await supa.from('backups').select('key').eq('table',table).order('created_at',{ascending:false});
  if(error) throw error; return res.status(200).json({ok:true,backups:(data||[]).map(r=>r.key)});
 }catch(e){ return res.status(500).json({ok:false,error:String(e.message||e)})}
};
