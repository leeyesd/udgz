import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPlaces } from '../lib/recommendations.ts';
import { thisWeekend, isPublicHoliday, validVisitDate } from '../lib/visit-calendar.ts';
import { availableOnDate } from '../lib/place-availability.ts';
const p=(id,environment,aesthetic,activity,rarity)=>({id,coreEnvironment:environment,score:aesthetic+activity+rarity,tagScores:{aestheticScore:aesthetic,activityScore:activity,rarityScore:rarity}});
test('intent-specific purple score takes priority; indoor excludes mixed and outdoor',()=>{
 const rows=[p('beauty','혼합',5,2,2),p('active','야외',1,5,3),p('rare','실내',2,3,5)];
 assert.equal(rankPlaces(rows,'감성적 휴식')[0].id,'beauty');
 assert.equal(rankPlaces(rows,'신나게 놀기')[0].id,'active');
 assert.equal(rankPlaces(rows,'특별한 체험')[0].id,'rare');
 assert.deepEqual(rankPlaces(rows,'실내 활동').map(x=>x.id),['rare']);
 assert.equal(rows[0].id,'beauty');
});
test('weekend dates handle Sunday, month and year boundaries',()=>{
 assert.deepEqual(thisWeekend('2026-09-29'),['2026-10-03','2026-10-04']);
 assert.deepEqual(thisWeekend('2026-10-04'),['2026-10-03','2026-10-04']);
 assert.deepEqual(thisWeekend('2026-12-31'),['2027-01-02','2027-01-03']);
 assert.equal(isPublicHoliday('2026-10-05'),true);
 assert.equal(isPublicHoliday('2027-05-13'),true);
 assert.equal(validVisitDate('2026-02-30'),false);
 assert.equal(validVisitDate('2028-01-01'),false);
});
const hours=Object.fromEntries([... '일월화수목금토'].map(d=>[d,{closed:d==='월',open:'10:00',close:'18:00',note:''}]));
test('holiday opening must be explicit and closure exceptions take priority',()=>{
 const base={weeklyHours:hours,holidayHours:'공휴일 확인 필요'};
 assert.equal(availableOnDate(base,'2026-10-03'),false);
 assert.equal(availableOnDate({...base,holidayHours:'공휴일 정상 운영'},'2026-10-03'),true);
 assert.equal(availableOnDate({...base,holidayHours:'법정공휴일 휴관'},'2026-10-03'),false);
 assert.equal(availableOnDate({...base,holidayHours:'연중무휴, 설날·추석 당일 휴무'},'2026-09-25'),false);
 assert.equal(availableOnDate({...base,holidayHours:'월요일 휴관(공휴일이면 운영, 다음날 휴관)'},'2026-10-05'),true);
 assert.equal(availableOnDate({...base,holidayHours:'월요일 휴관(공휴일이면 운영, 다음날 휴관)'},'2026-10-06'),false);
 assert.equal(availableOnDate(base,'2026-09-28'),false);
 assert.equal(availableOnDate(base,'2026-09-29'),true);
});
