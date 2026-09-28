import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { placeNameKey, validateTagScores } from '../lib/place-tags.ts';

test('tag scores accept zero and reject invalid values', () => {
  validateTagScores({aestheticScore:0, activityScore:3, rarityScore:5});
  for (const value of [-1, 6, 2.5, '4']) assert.throws(() => validateTagScores({aestheticScore:value}));
});

test('new migration preserves roots and uniquely identifies children at the same address', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0000_silky_silver_centurion.sql', import.meta.url),'utf8'));
  db.exec("INSERT INTO places (name,full_address,address_key,summary,weekly_hours,prices,themes,official_sources,reasons) VALUES ('부모','서울 주소','서울주소','원본','{}','[]','[]','[]','[]')");
  const original=db.prepare('SELECT * FROM places').get();
  db.exec(readFileSync(new URL('../drizzle/0001_sour_lilith.sql', import.meta.url),'utf8'));
  const migrated=db.prepare('SELECT * FROM places').get();
  for(const key of Object.keys(original)) assert.equal(migrated[key],original[key]);
  const insert=db.prepare("INSERT INTO places(name,full_address,address_key,parent_place_id,name_key,weekly_hours,prices,themes,official_sources,reasons) VALUES (?,?,?,?,?,'{}','[]','[]','[]','[]')");
  insert.run('어린이 체험실','서울 주소','서울주소',1,placeNameKey('어린이 체험실'));
  assert.throws(()=>insert.run('어린이체험실','서울 주소','서울주소',1,placeNameKey('어린이체험실')));
  insert.run('다른 체험실','서울 주소','서울주소',1,placeNameKey('다른 체험실'));
  assert.equal(db.prepare('SELECT count(*) AS n FROM places').get().n,3);
  db.close();
});
