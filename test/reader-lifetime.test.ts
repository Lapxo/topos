import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readerLifetime} from '../src/wire/reader-lifetime.ts';
const contract={scope:'wire/reader-lifetime',value:'bounded-process@1'};
const budget=(scope:string,measure:string,value:string)=>({scope,measure,value,form:'interval',role:'writes'});
test('bounded lifetime requires declared positive finite budgets and local bounds cannot widen global bounds',()=>{
 assert.equal(readerLifetime([],'reader-a'),undefined);
 const policy=[contract,budget('reader/timeout','milliseconds','0..100'),budget('reader/response-bytes','bytes','0..10000')];
 assert.deepEqual(readerLifetime(policy,'reader-a'),{timeoutMs:100,responseBytes:10000});
 assert.deepEqual(readerLifetime([...policy,budget('reader/reader-a/timeout','milliseconds','0..50')],'reader-a'),{timeoutMs:50,responseBytes:10000});
 assert.deepEqual(readerLifetime([...policy,budget('reader/reader-a/timeout','milliseconds','0..500')],'reader-a'),{timeoutMs:100,responseBytes:10000});
 assert.throws(()=>readerLifetime([contract],'reader-a'),/no declared timeout/);
 for(const value of ['0..*','0..0','-1..10','2..1','not-a-number'])assert.throws(()=>readerLifetime([contract,budget('reader/timeout','milliseconds',value)],'reader-a'),/invalid/);
});

test('valid empty readings require explicit permission and are distinct from required or absent input',async()=>{
 const {readerAllowsEmpty}=await import('../src/wire/reader-lifetime.ts');
 const contract={scope:'wire/reader-empty',value:'declared-empty@1'},allow={scope:'reader/empty',measure:'id',value:'allow',form:'alphabet',role:'writes'};
 assert.equal(readerAllowsEmpty([],'one'),false);assert.equal(readerAllowsEmpty([contract,allow],'one'),true);
 assert.equal(readerAllowsEmpty([contract,allow,{...allow,scope:'reader/one/empty',value:'required'}],'one'),false);
 assert.throws(()=>readerAllowsEmpty([contract,{...allow,value:'zero'}],'one'),/invalid empty policy/);
});
