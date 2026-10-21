import {test} from 'node:test';
import {deepStrictEqual as equal, notEqual, throws} from 'node:assert/strict';
import {intervals} from '@lapxo/obligations';
import {canonical, parse, readingIdentityBytes} from '../src/core.ts';
import {standingBytes, semanticStandingBytes} from '../src/topos/standing.ts';
import {composePolicy, policyTransition} from '../src/contract/policy.ts';
import {unionReadings} from '../src/contract/readings.ts';
import {under} from '../src/authority/admit.ts';
import {wireAt} from '../src/wire/claimline.ts';
import {intervalForm} from '../src/forms/interval.ts';

/** Deterministic consumer output, also captured by the cross-version runner. */
export function algebraAlignmentSnapshot() {
  const params={lo:0,hi:100}, lattice=intervals(0,100);
  const field={coordinate:'temperature',mode:'meet' as const,lattice,
    decode:(value:string)=>intervalForm.parse(params,value),inhabited:(value:{lo:number;hi:number})=>value.lo<=value.hi};
  const line=(value:string)=>canonical({scope:'sample/temperature',role:'reads',form:'interval',measure:'value',value});
  const one=line('10..30'),two=line('20..40');
  const declaration={scope:'wire/fields',value:'scope|value',by:'writer',epoch:'1'};
  const withdrawn={...declaration,value:'withdraw',epoch:'2'};
  const wire=wireAt([declaration,withdrawn],2);
  return {
    parse:parse(one),
    meet:composePolicy(field,[{source:'north',value:'10..30',own:false},{source:'south',value:'20..40',own:false}]),
    fork:composePolicy(field,[{source:'north',value:'10..15',own:false},{source:'south',value:'20..40',own:false}]),
    transitions:[policyTransition(field,{lo:10,hi:30},{lo:15,hi:25}),policyTransition(field,{lo:10,hi:30},{lo:5,hi:35})],
    coverage:[under('sample/temperature','sample/temperature/north'),under('sample/temperature','sample/temperatures')],
    union:unionReadings([{world:'north',region:'temperature',lines:[one]},{world:'south',region:'temperature',lines:[one,two]}]),
    standing:standingBytes([one,two,one]),
    effective:[semanticStandingBytes([one,two]),semanticStandingBytes([two,one])],
    withdrawalFields:wire===null?null:[...wire.fields].sort(),
    identity:new TextDecoder().decode(readingIdentityBytes({instrument:'sample',implementation:'versioned-model',policy:'declared-policy',inputs:[['south','b'],['north','a']],environment:[]})),
  };
}

test('consumed algebra preserves projection, conflict, refinement, withdrawal and input identity',()=>{
  const x=algebraAlignmentSnapshot();
  equal(x.meet.kind,'compatible');equal(x.meet.value,{lo:20,hi:30});
  equal(x.fork.kind,'incompatible');equal(x.transitions,['narrowing','widening-needs-authority']);
  equal(x.coverage,[true,false]);equal(x.union.lines.length,2);equal(x.union.disagreements.length,1);
  notEqual(x.effective[0],x.effective[1]);equal(x.withdrawalFields,null);
  equal(x.identity,'["reading-context@1","sample","versioned-model","declared-policy",[["north","a"],["south","b"]],[]]\n');
  equal(algebraAlignmentSnapshot(),x);
  throws(()=>standingBytes([canonical({scope:'sample',value:'withdraw'})]),/history is not standing/);
});
