import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrice, priceForDate, isWeekend, mergedPlaceName } from '../lib/place-pricing.ts';

const row = {label:'어린이',minAge:'',maxAge:'',price:'평일 11,000원 / 주말·공휴일 13,000원',free:false,note:'9월 적용'};
test('legacy prices split without losing notes; repeated conversion is stable', () => {
  const converted = normalizePrice(row);
  assert.equal(converted.weekdayPrice, '11000');
  assert.equal(converted.weekendPrice, '13000');
  assert.equal(converted.note, row.note);
  assert.deepEqual(normalizePrice(converted), converted);
  assert.equal(priceForDate(converted, '2026-09-28'), '11,000원');
  assert.equal(priceForDate(converted, '2026-10-03'), '13,000원');
  assert.equal(priceForDate(converted, '2026-10-04'), '13,000원');
});
test('unknown, free and legacy common prices remain distinct; missing weekend never borrows weekday', () => {
  assert.equal(priceForDate({...row,price:'',free:true}, '2026-10-04'), '무료');
  assert.equal(priceForDate({...row,price:'',weekdayPrice:'4000',weekendPrice:''}, '2026-10-04'), '찾는중..');
  assert.match(priceForDate({...row,price:'4000'}, '2026-10-04'), /기존 공통요금/);
  assert.equal(isWeekend('2026-02-30'), null);
});
test('branch merge preserves names and does not duplicate an existing suffix', () => {
  assert.equal(mergedPlaceName('어린이공간', '수원점'), '어린이공간 수원점');
  assert.equal(mergedPlaceName('어린이공간 수원점', '수원점'), '어린이공간 수원점');
});
