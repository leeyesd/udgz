import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRegion,regionLabel} from '../lib/place-region.ts';
test('metropolitan regions use districts, provinces use municipalities',()=>{
 assert.deepEqual(normalizeRegion({province:'서울특별시',city:'서울',fullAddress:'서울특별시 도봉구 마들로 1'}),{province:'서울',city:'도봉구'});
 assert.equal(regionLabel({province:'경기도',city:'수원시 영통구',fullAddress:'경기도 수원시 영통구 광교로 1'}),'경기 수원시');
 assert.equal(regionLabel({province:'부산광역시',city:'부산',fullAddress:'부산광역시 기장군 기장읍 1'}),'부산 기장군');
 assert.equal(regionLabel({province:'서울특별시',city:'강동구'}),'서울 강동구');
 assert.equal(regionLabel({province:'경기',city:'광주시'}),'경기 광주시');
});
test('do not invent a district for metropolitan-only or unknown addresses; normalization is stable',()=>{
 assert.deepEqual(normalizeRegion({province:'서울특별시',city:'서울'}),{province:'서울',city:''});
 assert.deepEqual(normalizeRegion({province:'세종특별자치시',city:'세종시'}),{province:'세종',city:''});
 const region=normalizeRegion({province:'서울특별시',city:'서울',district:'강동구'});
 assert.deepEqual(normalizeRegion(region),region);
});
