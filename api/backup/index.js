
const { getAdmin } = require('../_lib/supabaseAdmin');
module.exports=async(req,res)=>{
 try{
  const supa=getAdmin();
  if(req.method==='POST'){
    const ts=new Date().toISOString().slice(0,19)+'Z', tables=['trucks','trailers','expenses','repairs','invoices'];
    const rows=[]; for(const t of tables){
      const {data,error}=await supa.from('tms').select('data').eq('table',t).order('updated_at',{ascending:true});
      if(error) throw error; rows.push({key:`backup:${ts}:tms:${t}`,table:t,payload:(data||[]).map(r=>r.data),created_at:new Date().toISOString()});
    }
    const {error:upErr}=await supa.from('backups').upsert(rows,{onConflict:'key'}); if(upErr) throw upErr;
    return res.status(200).json({ok:true,created:rows.length});
  }
  if(req.method==='GET'){
    const key=(req.query&&req.query.key)||(new URL(req.url,'http://x').searchParams.get('key'));
    if(!key) return res.status(400).json({ok:false,error:'key required'});
    const {data,error}=await supa.from('backups').select('payload').eq('key',key).maybeSingle();
    if(error) throw error; res.setHeader('Content-Type','application/json'); return res.status(200).send(JSON.stringify((data&&data.payload)||[]));
  }
  return res.status(405).json({ok:false,error:'Method not allowed'});
 }catch(e){ return res.status(500).json({ok:false,error:String(e.message||e)})}
};
