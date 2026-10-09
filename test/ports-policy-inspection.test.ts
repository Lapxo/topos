import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {intervals} from '@lapxo/obligations';
import {composePolicy,policyTransition,checkCommandPort,commandRequest,commandResponse,
  releaseSuccessors,weightOf,vacuityOf,inspectionSelection} from '@lapxo/topos/contract';

for(const place of ['survey','stock']) {
  test(`policy composition keeps empty meets and parent constraints in ${place}`,()=>{
    const lattice=intervals(0,100);
    const field={coordinate:`${place}/limit`,mode:'meet' as const,lattice,inhabited:lattice.inhabited,
      decode:(text:string)=>{const [lo,hi]=text.split('..').map(Number);return {lo:lo!,hi:hi!};}};
    const readings=[{source:'parent',own:false,value:'2..3'},{source:'own',own:true,value:'5..6'}];
    const result=composePolicy(field,readings);assert.equal(result.kind,'incompatible');assert.deepEqual(result.value,{lo:5,hi:3});
    assert.equal(composePolicy(field,[...readings].reverse()).kind,result.kind);
    assert.equal(composePolicy(field,[...readings,readings[0]!]).kind,result.kind);
    assert.equal(policyTransition(field,{lo:0,hi:50},{lo:0,hi:100}),'widening-needs-authority');
    assert.equal(policyTransition(field,{lo:0,hi:50},{lo:10,hi:40}),'narrowing');
    assert.equal(composePolicy({...field,mode:'own'},readings).kind,'compatible');
    assert.equal(composePolicy({...field,mode:'exact'},readings).kind,'incompatible');
    assert.equal(composePolicy(field,[]).kind,'unread');
    assert.equal(composePolicy({...field,mode:'exact'},[{source:'own',own:true,value:'5..3'}]).kind,'incompatible');
    assert.throws(()=>composePolicy({...field,mode:'unknown' as 'meet'},readings),/undeclared composition/);
  });
  test(`command framing exposes no partial successful lot in ${place}`,()=>{
    const port={coordinate:`port/${place}`,implementation:'sha256:program',closure:['sha256:program'],timeoutMs:1000,responseBytes:4096,environment:['LANG'],stderr:'reject' as const};
    const lot={identity:'sha256:lot',requests:['one','two']};
    checkCommandPort(port,{admitsDeclaration:()=>true,covers:coordinate=>coordinate===port.coordinate,verifies:digest=>digest===port.implementation});
    assert.throws(()=>checkCommandPort(port,{admitsDeclaration:()=>true,covers:()=>false,verifies:()=>true}),/not covered/);
    assert.throws(()=>checkCommandPort(port,{admitsDeclaration:()=>true,covers:()=>true,verifies:()=>false}),/unverified/);
    assert.throws(()=>checkCommandPort(port,{admitsDeclaration:()=>false,covers:()=>true,verifies:()=>true}),/not admitted/);
    const request=JSON.parse(commandRequest(port,lot));assert.equal(request.requests.length,2);
    const output=JSON.stringify({protocol:'command-lot/1',coordinate:port.coordinate,implementation:port.implementation,identity:lot.identity,responses:['a','b']})+'\n';
    const execution={status:0,interrupted:false,stdout:output,stderr:''};
    assert.deepEqual(commandResponse(port,lot,execution,response=>typeof response==='string'),['a','b']);
    assert.throws(()=>commandResponse(port,lot,{...execution,status:1},()=>true),/status 1/);
    assert.throws(()=>commandResponse(port,lot,{...execution,interrupted:true},()=>true),/interrupted/);
    assert.throws(()=>commandResponse(port,lot,{...execution,stdout:output.trimEnd()},()=>true),/incomplete/);
    assert.throws(()=>commandResponse(port,lot,execution,(_,index)=>index===0),/invalid response member/);
    assert.throws(()=>commandResponse({...port,responseBytes:1},lot,execution,()=>true),/exceeded/);
    assert.throws(()=>commandResponse(port,{identity:lot.identity,requests:[]},execution,()=>true),/empty, invalid or unnamed lot/);
  });
  test(`release lineage keeps alternate authenticated successors in ${place}`,()=>{
    const a={digest:'sha256:a',predecessor:'sha256:current'},b={digest:'sha256:b',predecessor:'sha256:current'};
    assert.deepEqual(releaseSuccessors('sha256:current',[b,a,a],()=>true),[a,b]);
    assert.deepEqual(releaseSuccessors('sha256:unrelated',[a],()=>true),[]);
    assert.throws(()=>releaseSuccessors('sha256:current',[a],()=>false),/unauthenticated/);
    assert.throws(()=>releaseSuccessors('sha256:a',[{digest:'sha256:a',predecessor:'sha256:b'},{digest:'sha256:b',predecessor:'sha256:a'}],()=>true),/cycle/);
  });
  test(`inspection keeps absent scans unknown in ${place}`,()=>{
    assert.deepEqual(weightOf([],false),{unit:'bytes',known:null,total:null,unreferenced:null});
    assert.deepEqual(weightOf([{digest:'sha256:a',bytes:12,named:true},{digest:'sha256:a',bytes:12,named:true},{digest:'sha256:b',bytes:7,named:false}],true),{unit:'bytes',known:19,total:19,unreferenced:7});
    assert.equal(weightOf([{digest:'sha256:a',bytes:null,named:true}],true).total,null);
    assert.equal(vacuityOf(7,3,[],false).reading,'unknown');
    assert.equal(vacuityOf(7,3,[],true).reading,'unobserved');
    assert.equal(vacuityOf(7,3,[6],false).reading,'observed');
    assert.deepEqual(inspectionSelection([place,place],[place]),[place]);
    assert.throws(()=>inspectionSelection(['missing'],[place]),/unknown coordinate/);
  });
}
