import {strict as assert} from 'node:assert';
import {standingBytes,readStanding,capsuleOffers} from '@lapxo/topos/standing';
import {canonical} from '@lapxo/topos/wire';
const declaration={scope:'offers/forms/span',role:'writes',form:'alphabet',measure:'extension',value:'parse',kind:'form'};
test('standing identity ignores delivery envelope and host projection, but retains semantic changes',()=>{
 const original=standingBytes([canonical(declaration)]);
 assert.equal(standingBytes([canonical({...declaration,by:'sender',epoch:'12',sig:'delivery',shape:'output.txt'})]),original);
 assert.notEqual(standingBytes([canonical({...declaration,value:'emit|parse'})]),original);
 assert.equal(standingBytes([canonical(declaration),canonical(declaration)]),original);
 assert.deepEqual(capsuleOffers(readStanding(original)),[]);
});
test('standing decoder refuses noncanonical bytes, withdrawals and incomplete artifact closure',()=>{
 assert.throws(()=>readStanding(canonical(declaration)),/REFUSE·topos/);
 assert.throws(()=>standingBytes([canonical({...declaration,value:'withdraw'})]),/history is not standing/);
 assert.throws(()=>readStanding(standingBytes([canonical({...declaration,kind:'capsule',measure:'digest',value:'sha256:missing'})])),/missing required restsOn/);
});
