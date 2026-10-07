import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {publicationCoverage} from '../src/contract/index.ts';
import type {PublicationMember,PublicationRole} from '../src/contract/index.ts';
const digest=(bytes:Uint8Array)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const make=(scope:string)=>{
  const artifacts=new Map<string,Uint8Array>();
  const members:PublicationMember[]=(['contract','yes','vector','no'] as PublicationRole[]).map(role=>{
    const bytes=Buffer.from(scope+'/'+role),id=digest(bytes);artifacts.set(id,bytes);return {role,digest:id};
  });
  return {row:{scope,members},artifacts};
};
for(const scope of ['protocol/encode','sensor/calibrate'])test('publication requires measured conformance, not four existing files: '+scope,()=>{
  const {row,artifacts}=make(scope);
  assert.equal(publicationCoverage([row],artifacts,new Map(),digest).closed,false);
  const measured=publicationCoverage([row],artifacts,new Map([[scope,{status:'met',members:row.members}]]),digest);
  assert.equal(measured.closed,true);assert.equal(measured.missing,0);
});
test('corrupt bytes and stale proof input identities refuse by coordinate',()=>{
  const {row,artifacts}=make('surface');
  const corrupt=new Map(artifacts);corrupt.set(row.members[0]!.digest,Buffer.from('altered'));
  assert.throws(()=>publicationCoverage([row],corrupt,new Map(),digest),/member digest differs at surface\/contract/);
  assert.throws(()=>publicationCoverage([row],artifacts,new Map([['surface',{status:'met',members:row.members.slice(1)}]]),digest),/proof input identity differs at surface/);
});
test('missing members, refused observations and empty surfaces cannot read green',()=>{
  const {row,artifacts}=make('surface');
  const omitted=new Map(artifacts);omitted.delete(row.members[3]!.digest);
  const missing=publicationCoverage([row],omitted,new Map([['surface',{status:'met',members:row.members}]]),digest);
  assert.equal(missing.closed,false);assert.deepEqual(missing.rows[0]?.missing,['no']);
  assert.equal(publicationCoverage([row],artifacts,new Map([['surface',{status:'refused',members:row.members}]]),digest).closed,false);
  assert.throws(()=>publicationCoverage([],new Map(),new Map(),digest),/empty public surface/);
});
