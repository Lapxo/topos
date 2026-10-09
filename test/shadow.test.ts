import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonical,shadowAt,shadowProfile} from '../src/core.ts';

const declarations=(shadow='1',cuts='0=commitment|1=shadow')=>Object.entries({
  profile:'semantic-standing@1',form:'alphabet',shadow,projections:cuts,
}).map(([name,value])=>canonical({scope:'wire/identity/'+name,role:'writes',measure:'id',form:'alphabet',value}));
const digest=(bytes:Uint8Array)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

for(const coordinate of ['catalogue/item','measurement/value'])test(`commitment identifies its actual canonical shadow: ${coordinate}`,()=>{
  const profile=shadowProfile(declarations())!;
  const live=[canonical({scope:coordinate,value:'none',by:'key',epoch:'3',shape:'file.txt'})];
  const shadow=shadowAt(live,profile,'1',digest);
  assert.equal(shadow.kind,'shadow');if(shadow.kind!=='shadow')throw Error('missing shadow');
  assert.deepEqual(shadowAt(live,profile,'0',digest),{kind:'commitment',identity:'alphabet@1:'+digest(shadow.bytes)});
  assert.equal(new TextDecoder().decode(shadow.bytes),canonical({scope:coordinate,value:'none'})+'\n');
  assert.throws(()=>shadowAt(live,profile,'4',digest),/undeclared resolution/);
});
test('resolution labels are declared exact text, not a fixed machine range',()=>{
  const label='9007199254740993';
  const profile=shadowProfile(declarations(label,`0=commitment|${label}=shadow`))!;
  const live=[canonical({scope:'name',value:'example'})];
  const result=shadowAt(live,profile,'0',digest);
  assert.ok(result.kind==='commitment'&&result.identity.startsWith('alphabet@'+label+':sha256:'));
  assert.equal(shadowProfile([]),undefined);
  assert.throws(()=>shadowProfile([...declarations(),canonical({scope:'wire/identity/form',value:'interval'})]),/conflicting/);
  assert.throws(()=>shadowProfile(declarations('1','0=commitment|1=shadow|1=shadow')),/duplicate/);
  assert.throws(()=>shadowProfile(declarations('1','0=commitment')),/does not name/);
  assert.throws(()=>shadowAt(live,{form:'alphabet@other',resolution:label,projections:profile.projections},'0',digest),/incomplete/);
  assert.throws(()=>shadowAt(live,{...profile,projections:new Map([['0','commitment']])},'0',digest),/does not name/);
});
