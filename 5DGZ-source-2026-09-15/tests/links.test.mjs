import assert from 'node:assert/strict';
import test from 'node:test';
import { cardLinks, normalizeLinks, searchUrl } from '../lib/place-links.ts';

test('affiliate wins for every reservation state while SNS remains independent', () => {
  for (const reservationRequired of [true, false, null]) {
    const result = cardLinks({name:'공원', reservationRequired, reservationUrl:'https://example.org/booking', affiliateUrl:'https://example.org/partner', snsUrl:'https://example.org/reviews'});
    assert.deepEqual(result.primary, {label:'예약하기',url:'https://example.org/partner'});
    assert.equal(result.sns,'https://example.org/reviews');
  }
});
test('reservation and no-reservation actions, search encoding, and missing links', () => {
  const place = {name:'아이 & 숲',reservationRequired:false,reservationUrl:'https://example.org/old'};
  assert.deepEqual(cardLinks(place).primary, {label:'더보기',url:searchUrl(place.name)});
  assert.equal(new URL(normalizeLinks(place).reservationUrl).searchParams.get('query'),'아이 & 숲 아이랑');
  assert.equal(cardLinks({...place,reservationRequired:true}).primary.url,'https://example.org/old');
  assert.equal(cardLinks({...place,reservationRequired:true,reservationUrl:''}).primary.url,'');
  assert.equal(normalizeLinks({...place,reservationRequired:true,reservationUrl:searchUrl(place.name)}).reservationUrl,'');
  assert.equal(cardLinks({...place,affiliateUrl:'javascript:alert(1)'}).primary.label,'더보기');
  assert.match(cardLinks(place).sns,/where=blog/);
});
