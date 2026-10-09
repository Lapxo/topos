import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {semanticStandingBytes,readSemanticStanding,standingBytes} from '@lapxo/topos/standing';
import {unionReadings,renderWriter,foldedEvidence,snapshotIdentity,responseIdentity,snapshotAccess,originRegion} from '@lapxo/topos/contract';
import {canonical} from '@lapxo/topos/wire';

const digest=(bytes:string)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const line=(value:string,origin='source-a')=>canonical({scope:'item/reading',role:'writes',form:'interval',measure:'span',value,origin});

for(const place of ['survey','stock']) {
  test(`semantic projection preserves effective acts in ${place}`,()=>{
    const sign=canonical({type:'mark',id:'s',cell:place,sign:'+1',pole:'ceiling',reach:'travels',value:'0..50'});
    const join=canonical({type:'mark',id:'j',cell:place,sign:'+1',pole:'ceiling',reach:'local',widens:'w',value:'0..100'});
    const bytes=semanticStandingBytes([sign,join]);
    assert.notEqual(digest(bytes),digest(semanticStandingBytes([join,sign])));
    assert.equal(standingBytes([sign,join]),standingBytes([join,sign]),'published set encoding stays compatible');
    assert.deepEqual(readSemanticStanding(bytes),[sign,join]);
    const enveloped=canonical({scope:'name',value:place,by:'device',sig:'delivery',epoch:'4',shape:'README.md'});
    assert.equal(semanticStandingBytes([enveloped]),semanticStandingBytes([canonical({scope:'name',value:place})]));
    assert.equal(semanticStandingBytes([sign,sign,join]),bytes);
    assert.throws(()=>readSemanticStanding(bytes.trimEnd()),/REFUSE·projection/);
    assert.throws(()=>semanticStandingBytes([canonical({scope:'name',value:'withdraw'})]),/history/);
  });
  test(`readings compose independent of world order in ${place}`,()=>{
    const a={world:'sha256:reader-a',region:place,lines:[line('2..3')]};
    const b={world:'sha256:reader-b',region:place,lines:[line('5..6','source-b')]};
    const silent={world:'sha256:reader-c',region:place,lines:[]};
    const union=unionReadings([a,b,silent]);
    for(const order of [[b,a,silent],[silent,b,a],[a,a,b]])assert.deepEqual(unionReadings(order),union);
    assert.equal(union.lines.length,2);assert.equal(union.disagreements.length,1);
    assert.equal(unionReadings([a,{...b,lines:[line('2..3','source-b')]}]).disagreements.length,0);
    assert.equal(renderWriter(`${place}.txt`,['writer-a','writer-a']),'writer-a');
    assert.throws(()=>renderWriter(`${place}.txt`,['writer-a','writer-b']),new RegExp(place));
  });
  test(`folded evidence separates history from authority in ${place}`,()=>{
    const old=line('2..3'),next=line('2..2'),withdraw=canonical({scope:'item/reading',role:'writes',form:'interval',measure:'span',value:'withdraw'});
    const foreign=line('5..6','foreign'),invalid=line('9..9','unadmitted');
    const result=foldedEvidence([old,next,withdraw,foreign,invalid],{
      classification:one=>one===foreign?'foreign':one===invalid?'unadmitted':'local',
      fold:local=>{assert.deepEqual(local,[old,next,withdraw]);return [withdraw];},
    });
    assert.deepEqual(result.standing,[]);assert.equal(result.history.length,3);
    assert.deepEqual(result.foreign,[foreign]);assert.deepEqual(result.unadmitted,[invalid]);
    assert.throws(()=>foldedEvidence([old],{classification:()=> 'local',fold:()=>[foreign]}),/unauthenticated/);
  });
  test(`snapshot history does not imply current reuse in ${place}`,()=>{
    const snapshot={source:place,content:'sha256:content',observed:'17',clock:'clock:fixture',freshness:'sha256:policy',implementation:'sha256:reader'};
    const context={principal:'person-a',authorization:'sha256:grant-a',implementation:snapshot.implementation,snapshot:snapshotIdentity(snapshot,digest),request:'sha256:request'};
    const permission={inspect:true,reuse:true,freshness:'fresh' as const};
    assert.deepEqual(snapshotAccess(snapshot,context,context,permission,digest),{inspect:true,reuse:true});
    for(const field of ['principal','authorization','implementation','snapshot','request'])assert.equal(snapshotAccess(snapshot,context,{...context,[field]:'changed'},permission,digest).reuse,false);
    assert.throws(()=>responseIdentity(snapshot,{...context,snapshot:'changed'},digest),/another snapshot/);
    assert.notEqual(responseIdentity(snapshot,context,digest),responseIdentity(snapshot,{...context,principal:'person-b'},digest));
    assert.deepEqual(snapshotAccess(snapshot,context,context,{...permission,freshness:'unknown'},digest),{inspect:true,reuse:false});
    assert.notEqual(snapshotIdentity(snapshot,digest),snapshotIdentity({...snapshot,observed:'18'},digest));
    assert.deepEqual(originRegion([canonical({scope:`region/${place}`,role:'writes',measure:'origin',value:'source:fixture'})],`region/${place}`),{source:'source:fixture'});
    assert.throws(()=>originRegion([canonical({scope:`region/${place}`,role:'writes',measure:'origin',value:'source:a'}),canonical({scope:`region/${place}`,role:'writes',measure:'origin',value:'source:b'})],`region/${place}`),/REFUSE·region/);
  });
}
