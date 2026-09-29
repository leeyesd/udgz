// 한국천문연구원 월력요항, 2026-09-29 확인.
// https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027
export const CALENDAR_MAX = '2027-12-31';
const holidayDays: Record<string,string[]> = {
 '2026':['01-01','02-16','02-17','02-18','03-01','03-02','05-01','05-05','05-24','05-25','06-03','06-06','07-17','08-15','08-17','09-24','09-25','09-26','10-03','10-05','10-09','12-25'],
 '2027':['01-01','02-06','02-07','02-08','02-09','03-01','05-01','05-03','05-05','05-13','06-06','07-17','07-19','08-15','08-16','09-14','09-15','09-16','10-03','10-04','10-09','10-11','12-25','12-27'],
};
export function validVisitDate(date:string) {
 const parsed = new Date(`${date}T12:00:00Z`);
 return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === date && Boolean(holidayDays[date.slice(0,4)]);
}
export function isPublicHoliday(date:string) { return holidayDays[date.slice(0,4)]?.includes(date.slice(5)) ?? false; }
export function seoulToday(now = new Date()) { return now.toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}); }
export function thisWeekend(today:string) {
 const date = new Date(`${today}T12:00:00Z`);
 const mondayOffset = (date.getUTCDay()+6)%7;
 return [5,6].map(offset => {const day = new Date(date);day.setUTCDate(date.getUTCDate()-mondayOffset+offset);return day.toISOString().slice(0,10);});
}
