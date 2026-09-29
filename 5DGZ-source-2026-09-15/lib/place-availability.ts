import type { PlaceRecord } from './place-record';
import { isPublicHoliday, validVisitDate } from './visit-calendar.ts';
type Hours = Pick<PlaceRecord,'weeklyHours'|'holidayHours'>;
const names=['일','월','화','수','목','금','토'] as const;
export function availableOnDate(place: Hours, date:string):boolean {
 if (!validVisitDate(date)) return false;
 const parsed=new Date(`${date}T12:00:00Z`), day=names[parsed.getUTCDay()];
 const hours=place.weeklyHours?.[day], note=(place.holidayHours??'').replace(/\s/g,'');
 const holiday=isPublicHoliday(date);
 const close=/휴관|휴무|휴원|미운영|운영하지|이용불가/;
 if (holiday) {
   if (/확인필요|확인중|찾는중|별도공지|공지확인|캘린더/.test(note)) return false;
   if (/공휴일[^.;]*?(휴관|휴무|휴원|미운영)/.test(note) && !/공휴일이면(정상)?(운영|개관)|공휴일제외|공휴일에는(정상)?운영/.test(note)) return false;
   // Named holiday closures override year-round opening.
   const md=date.slice(5), yr=date.slice(0,4);
   const seollal=yr==='2026'?['02-16','02-17','02-18']:['02-06','02-07','02-08'];
   const chuseok=yr==='2026'?['09-24','09-25','09-26']:['09-14','09-15','09-16'];
   if (close.test(note) && ((md==='01-01'&&/1월1일|1\/1|신정/.test(note)) || (seollal.includes(md)&&/설/.test(note)) || (chuseok.includes(md)&&/추석/.test(note)))) return false;
   const explicitOpen=/연중무휴|365일|공휴일[^.;]*?(정상운영|운영|개관|\d{1,2}:\d{2})/.test(note);
   if (!explicitOpen) return false; // Holiday opening must be confirmed, never inferred from missing data.
   if (hours?.closed && !/연중무휴|365일|공휴일/.test(note)) return false;
   return true;
 }
 if (hours?.closed) return false;
 // Observed closures following a Monday public holiday.
 const yesterday=new Date(parsed);yesterday.setUTCDate(parsed.getUTCDate()-1);
 if(day==='화'&&isPublicHoliday(yesterday.toISOString().slice(0,10))&&/다음날|익일/.test(note)&&/월요일/.test(note)) return false;
 if (/첫째월요일/.test(note)&&day==='월'&&parsed.getUTCDate()<=7) return false;
 return Boolean(hours && (hours.open || hours.note) && !/확인필요|확인중|찾는중/.test(hours.note));
}
