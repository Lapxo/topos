import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonical,placeRequirements,readReleaseDelivery} from '../src/core.ts';
const world='sha256:'+'a'.repeat(64),blob='sha256:'+'b'.repeat(64);
const profile=canonical({scope:'wire/adoption/profile',role:'writes',measure:'id',form:'alphabet',value:'place-requirements@1'});
for(const [name,desired] of [
 ['catalogue',canonical({scope:'wire/region-measures',role:'writes',form:'alphabet',measure:'id',value:'coordinates|origin'})],
 ['measurement',canonical({scope:'prose/separator',role:'writes',form:'alphabet',measure:'text',value:'\n'})],
])test(`adoption exposes declared place requirements without landing them: ${name}`,()=>{
 const requirement=canonical({scope:'needs/place/'+name,role:'demands',measure:'line',form:'alphabet',value:desired});
 const standing=[profile,requirement];
 assert.deepEqual(placeRequirements(world,standing),[{world,coordinate:'needs/place/'+name,line:desired}]);
 assert.deepEqual(placeRequirements(world,[requirement,profile]),placeRequirements(world,standing));
 assert.deepEqual(placeRequirements(world,[profile,requirement,requirement]),placeRequirements(world,standing),'re-delivery adds no requirement');
 assert.throws(()=>placeRequirements(world,[requirement]),/no declared profile/);
 const alternative=canonical({scope:'needs/place/'+name,role:'demands',measure:'line',form:'alphabet',value:canonical({scope:'prose/separator',value:'other'})});
 assert.equal(placeRequirements(world,[profile,requirement,alternative]).length,2,'conflicting declarations are retained, never first-wins');
 const signed=canonical({scope:'needs/place/'+name,role:'demands',measure:'line',value:canonical({scope:'wire/forms',value:'alphabet',by:'foreign',epoch:'4',sig:'foreign'})});
 assert.throws(()=>placeRequirements(world,[profile,signed]),/borrowed history/);
});
test('release metadata is a delivery hint; lineage and byte verification stay separate',()=>{
 const delivery={standing:world,blob,predecessor:'sha256:'+'c'.repeat(64)};
 assert.deepEqual(readReleaseDelivery(JSON.stringify(delivery)),delivery);
 assert.deepEqual(readReleaseDelivery(JSON.stringify({standing:'alphabet@1:'+world,blob})),{standing:'alphabet@1:'+world,blob});
 for(const bad of ['{}','[]','null','not-json',JSON.stringify({...delivery,ready:true}),JSON.stringify({standing:world,blob:'https://example.invalid/archive'})])
  assert.throws(()=>readReleaseDelivery(bad),/REFUSE·release/);
 assert.deepEqual(placeRequirements(world,[]),[],'absence does not invent requirements');
 assert.deepEqual(placeRequirements(world,[profile,profile]),[],'identical delivery adds no requirement or disagreement');
 assert.throws(()=>placeRequirements(world,[profile,canonical({scope:'wire/adoption/profile',value:'other'})]),/conflicting/);
});

test('published adoption data keeps missing contracts and borrowed authority visible',async()=>{
 const {readFileSync}=await import('node:fs');
 const sample=JSON.parse(readFileSync(new URL('../samples/readings/adoption.no.json',import.meta.url),'utf8'));
 for(const row of sample.cases){
  const run=()=>row.kind==='metadata'?readReleaseDelivery(JSON.stringify(row.value)):placeRequirements(row.world,row.standing);
  assert.throws(run,error=>error instanceof Error&&error.message.startsWith(row.refusal));
 }
 const yes=JSON.parse(readFileSync(new URL('../samples/readings/adoption.yes.json',import.meta.url),'utf8'));
 for(const place of yes.places){
  assert.equal(readReleaseDelivery(JSON.stringify(place.delivery)).standing,place.world);
  const proposed=placeRequirements(place.world,place.standing);
  assert.equal(proposed.length,1);
  assert.equal(proposed[0]?.world,place.world);
  assert.equal(proposed[0]?.coordinate,'needs/place/'+place.name);
 }
});
