import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolvePlaceStatus } from '../lib/place-status.ts';

test('all nine research/review combinations and duplicate protection', () => {
  for (const research of ['hold', 'incomplete', 'review_required']) {
    for (const review of ['pending', 'approved', 'rejected']) {
      const actual = resolvePlaceStatus(research, review);
      const expected = review !== 'rejected' && (research === 'review_required' || research === 'incomplete' && review === 'approved');
      assert.equal(actual.isPublic, expected, `${research}/${review}`);
      assert.equal(actual.researchStatus, review === 'rejected' ? 'hold' : research);
      assert.equal(actual.reviewStatus, review);
      assert.equal(resolvePlaceStatus(research, review, true).isPublic, false);
    }
  }
  assert.throws(() => resolvePlaceStatus('invalid', 'pending'));
  assert.throws(() => resolvePlaceStatus('hold', 'invalid'));
});

test('migration preserves every existing field and changes only workflow fields', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('./fixtures/legacy-drizzle/0000_nice_sunset_bain.sql', import.meta.url), 'utf8'));
  const insert = db.prepare("INSERT INTO places (name,status,weekly_hours,prices,themes,official_sources,reasons,duplicate_of_id,summary) VALUES (?,?, '{}','[]','[]','[]','[]',?,?)");
  for (const [name, status, duplicate] of [['보류장소','pending',null],['공개장소','published',null],['중복장소','duplicate',2]]) insert.run(name,status,duplicate,'원본 내용');
  const before = db.prepare('SELECT * FROM places ORDER BY id').all();
  db.exec('BEGIN');
  db.exec(readFileSync(new URL('./fixtures/legacy-drizzle/0001_place_workflow.sql', import.meta.url), 'utf8'));
  db.exec('COMMIT');
  const after = db.prepare('SELECT * FROM places ORDER BY id').all();
  assert.equal(after.length, before.length);
  for (let i=0; i<before.length; i++) {
    for (const key of Object.keys(before[i])) assert.equal(after[i][key], before[i][key], key);
  }
  assert.deepEqual(after.map(r => [r.research_status,r.review_status,r.is_public]), [['hold','pending',0],['review_required','approved',1],['hold','pending',0]]);
  db.exec("INSERT INTO places (name,weekly_hours,prices,themes,official_sources,reasons,reservation_required) VALUES ('신규','{}','[]','[]','[]','[]',NULL)");
  const added = db.prepare("SELECT * FROM places WHERE name='신규'").get();
  assert.equal(added.id,4);
  assert.equal(added.is_public,0);
  assert.equal(added.reservation_required,null);
  assert.throws(() => db.exec("UPDATE places SET review_status='invalid' WHERE id=1"));
  db.close();
});
