import {test} from 'node:test';
import {deepStrictEqual as equal, notStrictEqual, throws} from 'node:assert/strict';
import {encodeReadingWitness, decodeReadingWitness, inspectReadingWitness, readingWitnessStatementBytes, type ReadingWitness} from '../src/contract/reading-witness.ts';
const h=(n:number)=>'sha256:'+n.toString(16).padStart(64,'0');
const common=(name:string)=>({class:'attest' as const,reading:h(1),contract:h(2),model:h(3),params:h(4),inputs:h(5),selection:h(6),unit:'physical-lines',scale:h(7),resolution:h(8),reader:h(9),implementation:h(10),context:h(11),run:name,result:h(12)});
for(const place of ['estuary-survey','archive-catalog']) {
 const key:ReadingWitness={...common(place),authentication:'key-covered',key:place+'/observer',coverage:h(13),evidence:h(14)};
 const ci:ReadingWitness={...common(place),authentication:'ci-run-unkeyed',repository:place+'/public-records',commit:'git:'+h(15),workflow:h(16),attempt:'1',evidence:h(17)};
 test(`${place}: declared key and CI witnesses retain complete canonical context`,()=>{
  for(const input of [key,ci]) {
   const line=encodeReadingWitness(input);
   equal(decodeReadingWitness(line),input);
   equal(encodeReadingWitness(Object.fromEntries(Object.entries(input).reverse()) as unknown as ReadingWitness),line);
   const got=inspectReadingWitness(input);
   equal(got.status,'declared');equal(got.authentication,'not verified');equal(got.authorization,'not established');
   equal(got.needsVerification.length,4);
   equal(got.statementBytes,readingWitnessStatementBytes(input));
   equal(readingWitnessStatementBytes({...input,evidence:h(99)}),got.statementBytes);
   notStrictEqual(readingWitnessStatementBytes({...input,result:h(99)}),got.statementBytes);
  }
 });
 test(`${place}: each consumed binding changes witness bytes instead of inheriting verification`,()=>{
  for(const input of [key,ci]) {
   const original=encodeReadingWitness(input);
   for(const field of ['reading','contract','model','params','inputs','selection','scale','resolution','reader','implementation','context','result','evidence']) {
    const changed={...input,[field]:h(99)} as ReadingWitness;
    notStrictEqual(encodeReadingWitness(changed),original);
    equal(inspectReadingWitness(changed).authentication,'not verified');
   }
  }
  for(const patch of [{commit:'git:another'},{workflow:h(99)},{run:place+'-other'},{attempt:'2'},{repository:'another/repository'}]) {
   notStrictEqual(encodeReadingWitness({...ci,...patch}),encodeReadingWitness(ci));
   equal(inspectReadingWitness({...ci,...patch}).authentication,'not verified');
  }
 });
 test(`${place}: malformed, incomplete, forged and noncanonical declarations refuse`,()=>{
  throws(()=>inspectReadingWitness({...ci,class:'authorize'} as unknown as ReadingWitness),/reading-class/);
  throws(()=>inspectReadingWitness({...ci,authentication:'attest'} as unknown as ReadingWitness),/authentication-profile/);
  for(const patch of [{verified:'true'},{sig:'secret'},{by:'owner'},{coverage:h(99)}])
   throws(()=>encodeReadingWitness({...ci,...patch} as ReadingWitness),/fields/);
  for(const field of ['inputs','evidence','workflow','result'])throws(()=>encodeReadingWitness({...ci,[field]:'https://example.invalid/run'} as ReadingWitness),/digest|ci-context/);
  for(const attempt of ['0','01','-1'])throws(()=>encodeReadingWitness({...ci,attempt}),/ci-context/);
  const {evidence,...missing}=ci;
  throws(()=>encodeReadingWitness(missing as ReadingWitness),/fields/);
  throws(()=>encodeReadingWitness({...key,coverage:'admitted'}),/coverage/);
  const line=encodeReadingWitness(ci);
  throws(()=>decodeReadingWitness(line+' '),/canonical|parse|REFUSE|invalid/i);
  throws(()=>decodeReadingWitness(line.replace('topos-reading-witness/1','topos-reading-witness/2')),/profile/);
 });
}
test('same reading in distinct contexts or producer runs remains distinct',()=>{
 const a:ReadingWitness={...common('run-1'),authentication:'ci-run-unkeyed',repository:'archive/repo',commit:'git:commit',workflow:h(16),attempt:'1',evidence:h(17)};
 notStrictEqual(encodeReadingWitness(a),encodeReadingWitness({...a,context:h(98)}));
 notStrictEqual(encodeReadingWitness(a),encodeReadingWitness({...a,run:'run-2'}));
 // Reuse preserves the original producer run; a later verifier cannot relabel it as a new production.
 equal(decodeReadingWitness(encodeReadingWitness(a)).run,'run-1');
});
test('public samples roundtrip; synthetic negative vectors refuse for their declared cause',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const name of ['catalog','orchard']) {
  const yes=JSON.parse(await readFile(new URL(`../samples/reading-witness/yes/${name}.json`,import.meta.url),'utf8')) as ReadingWitness;
  equal(decodeReadingWitness(encodeReadingWitness(yes)),yes);
  const no=JSON.parse(await readFile(new URL(`../samples/reading-witness/no/${name}.json`,import.meta.url),'utf8'));
  throws(()=>inspectReadingWitness(no.input),error=>error instanceof Error&&error.message==='REFUSE·'+no.expectedRefusal);
 }
});
