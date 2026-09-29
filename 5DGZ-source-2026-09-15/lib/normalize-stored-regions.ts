import { normalizeRegion } from './place-region';
// Region-only backfill. Compare original fields to avoid overwriting concurrent edits.
export async function normalizeStoredRegions(db:D1Database) {
 let cursor=0,changed=0,unresolved=0;
 while(true) {
  const {results}=await db.prepare('SELECT id,province,city,full_address,district FROM places WHERE id > ? ORDER BY id LIMIT 50').bind(cursor).all<{id:number;province:string;city:string;full_address:string;district:string}>();
  if(!results.length)break;
  const updates=results.flatMap(row=>{
   const region=normalizeRegion({...row,fullAddress:row.full_address});
   if(!region.city)unresolved++;
   if(region.province===row.province&&region.city===row.city)return [];
   return [db.prepare('UPDATE places SET province=?,city=? WHERE id=? AND province=? AND city=? AND full_address=? AND district=?').bind(region.province,region.city,row.id,row.province,row.city,row.full_address,row.district)];
  });
  if(updates.length){const r=await db.batch(updates);changed+=r.reduce((n,row)=>n+(row.meta.changes??0),0);}
  cursor=results[results.length-1].id;
 }
 return {changed,unresolved};
}
