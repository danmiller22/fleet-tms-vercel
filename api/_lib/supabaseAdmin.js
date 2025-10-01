
const { createClient } = require('@supabase/supabase-js');
function getAdmin(){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE;
  if(!url||!key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  return createClient(url,key,{auth:{persistSession:false}});
}
module.exports={getAdmin};
