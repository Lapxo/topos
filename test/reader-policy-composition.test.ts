import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readerLifetime} from '../src/wire/reader-lifetime.ts';

const selector=(value:string)=>({scope:'wire/reader-lifetime',role:'writes',form:'alphabet',measure:'id',value});
const limit=(scope:string,measure:string,value:string)=>({scope,role:'writes',form:'interval',measure,value});
for(const reader of ['catalogue','measurement'])test(`reader policy composes by meet: ${reader}`,()=>{
  const policy=[selector('bounded-process@2'),limit('reader/timeout','milliseconds','0..100'),
    limit('reader/response-bytes','bytes','0..8192'),
    limit(`reader/${reader}/timeout`,'milliseconds','0..30')];
  assert.deepEqual(readerLifetime(policy,reader),{timeoutMs:30,responseBytes:8192});
  assert.deepEqual(readerLifetime([...policy].reverse(),reader),readerLifetime(policy,reader));
  assert.deepEqual(readerLifetime([...policy,limit(`reader/${reader}/response-bytes`,'bytes','0..9999')],reader),
    {timeoutMs:30,responseBytes:8192});
  // Lower bounds are real constraints too; the empty meet must remain visible.
  const disjoint=[selector('bounded-process@2'),limit('reader/timeout','milliseconds','2..3'),
    limit(`reader/${reader}/timeout`,'milliseconds','5..6'),limit('reader/response-bytes','bytes','0..8192')];
  assert.throws(()=>readerLifetime(disjoint,reader),new RegExp(`REFUSE·reader ${reader} conflicting timeout`));
  assert.throws(()=>readerLifetime([...disjoint].reverse(),reader),/conflicting timeout/);
  // Compatibility is explicit, not a reinterpretation of old admitted lines.
  assert.deepEqual(readerLifetime([selector('bounded-process@1'),...disjoint.slice(1)],reader),
    {timeoutMs:3,responseBytes:8192});
});
test('two declared lifetime profiles refuse instead of choosing a version',()=>{
  assert.throws(()=>readerLifetime([selector('bounded-process@1'),selector('bounded-process@2')],'measurement'),
    /REFUSE·wire conflicting reader lifetime profiles/);
});

test('declared reader coordinate is selected only by the new lifetime profile',()=>{
 const rows=[limit('reader/timeout','milliseconds','0..100'),limit('reader/response-bytes','bytes','0..8192'),
  limit('reader/catalogue/timeout','milliseconds','0..30'),limit('reader/provider.mjs/timeout','milliseconds','0..80')];
 const reference={id:'catalogue',module:'provider.mjs'};
 assert.equal(readerLifetime([selector('bounded-process@1'),...rows],reference)?.timeoutMs,80);
 assert.equal(readerLifetime([selector('bounded-process@2'),...rows],reference)?.timeoutMs,30);
});
