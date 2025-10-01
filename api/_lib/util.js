
const crypto=require('crypto');
function primaryKeyOf(o){ if(!o||typeof o!=='object')return null;
 if('id'in o) return String(o.id);
 if('unit'in o) return String(o.unit);
 if('number'in o) return String(o.number);
 if('plate'in o) return String(o.plate);
 return crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex');}
module.exports={primaryKeyOf};
