import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonical} from '../src/wire/line.ts';
import {standingBytes,readStanding,capsuleDescriptor,assertCapsuleDescriptor} from '../src/topos/standing.ts';
const row=(scope:string,value:string,extra:Record<string,string>={})=>canonical({scope,value,measure:'reads',role:'render',...extra});
test('standing region descriptors are optional, exact and cannot hide another artifact contract',()=>{
 const protocol=row('wire/capsule-declaration','standing-regions@1',{measure:'id',role:'writes'});
 const actual=row('region/report','name');
 const declaration=row('offers/example/declaration/region/report','name');
 const world=(lines:string[])=>readStanding(standingBytes(lines));
 const descriptor=capsuleDescriptor(world([protocol,declaration]),'offers/example')!;
 assert.deepEqual(descriptor.declaration.renders,['report']);
 assertCapsuleDescriptor(descriptor.lines,[actual]);
 assertCapsuleDescriptor(descriptor.lines,[row('region/report','name',{epoch:'99',sig:'delivery',by:'resigned'})]);
 assert.throws(()=>assertCapsuleDescriptor(descriptor.lines,[row('region/report','different')]),/differs/);
 assert.throws(()=>assertCapsuleDescriptor(descriptor.lines,[actual,row('region/hidden','name')]),/differs/);
 assert.throws(()=>capsuleDescriptor(world([declaration]),'offers/example'),/needs standing-regions/);
 assert.equal(capsuleDescriptor(world([protocol]),'offers/historical'),undefined);
});
