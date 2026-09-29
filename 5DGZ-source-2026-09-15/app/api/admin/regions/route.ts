import { isAdminRequest, runtimeEnv, unauthorized } from "../../../../lib/admin-access";
import { normalizeStoredRegions } from "../../../../lib/normalize-stored-regions";
export async function GET(request:Request) {
 if(!isAdminRequest(request))return unauthorized();
 const db=runtimeEnv().DB;
 if(!db)return Response.json({error:"DB 연결 실패"},{status:503});
 try {
  const {results}=await db.prepare('SELECT id,province,city,full_address,district FROM places ORDER BY id').all();
  return Response.json({regions:results});
 } catch {return Response.json({error:"지역 조회 실패"},{status:500});}
}
export async function POST(request:Request) {
 if(!isAdminRequest(request))return unauthorized();
 const db=runtimeEnv().DB;
 if(!db)return Response.json({error:"DB 연결 실패"},{status:503});
 try {return Response.json(await normalizeStoredRegions(db));}
 catch {return Response.json({error:"지역 정리를 완료하지 못했습니다."},{status:500});}
}
