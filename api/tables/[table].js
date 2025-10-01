
const { getAdmin } = require('../_lib/supabaseAdmin');
const { primaryKeyOf } = require('../_lib/util');
module.exports=async(req,res)=>{
 try{
  const {table}=req.query; if(!table) return res.status(400).json({ok:false,error:'table required'});
  const supa=getAdmin();
  if(req.method==='GET'){
    const {data,error}=await supa.from('tms').select('data').eq('table',table).order('updated_at',{ascending:true});
    if(error) throw error; res.setHeader('Cache-Control','no-store');
    return res.status(200).json((data||[]).map(r=>r.data));
  }
  if(req.method==='PUT'){
    let payload=[]; try{payload=req.body}catch{}
    if(!Array.isArray(payload)) payload=[];
    const keys=payload.map(primaryKeyOf);
    let existing=[]; if(keys.length){
      const {data:ex,error:exErr}=await supa.from('tms').select('pk,data').eq('table',table).in('pk',keys);
      if(exErr) throw exErr; existing=ex||[];
    }
    const map=new Map(existing.map(r=>[String(r.pk),r.data]));
    const upserts=payload.map(row=>{const pk=primaryKeyOf(row); const prev=map.get(pk)||{}; const merged=Object.assign({},prev,row);
      return {table,pk,data:merged,updated_at:new Date().toISOString()};});
    const {error:upErr}=await supa.from('tms').upsert(upserts,{onConflict:'table,pk'});
    if(upErr) throw upErr; return res.status(200).json({ok:true,count:upserts.length});
  }
  return res.status(405).json({ok:false,error:'Method not allowed'});
 }catch(e){ return res.status(500).json({ok:false,error:String(e.message||e)})}
};
