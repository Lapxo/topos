import {createHash,generateKeyPairSync,sign,verify} from 'node:crypto';
import {canonical,parse,signedBytes} from '../src/wire/line.ts';
import {actIdentity,type ActResultContract} from '../src/wire/act-result.ts';
import {actionStatementBytes,type ActionStatement,type ActionReceipt} from '../src/contract/action-link.ts';
import {type AuthorityCard,type AuthorityCardContext} from '../src/contract/authority-card.ts';
export const budget={bytes:65536,items:128};
export const hash=(x:string|Uint8Array)=>'sha256:'+createHash('sha256').update(x).digest('hex');
export function card(place:string):AuthorityCard{return {place,key:'writer',snapshot:hash(place+'/snapshot'),authority:hash(place+'/authority'),coverage:hash(place+'/coverage'),policy:hash('policy'),budget:hash('budget'),catalog:hash('catalog'),standingContract:hash('standing'),grants:[hash('grant')],retirements:[],demands:[],horizon:{clock:'declared-clock',unit:'ticks',from:10,through:20},issuedAt:10,actions:[{request:hash('request'),decision:'allow'}],evidence:hash('external-judgment')};}
export function cardContext(c:AuthorityCard):AuthorityCardContext{return {...c,clock:{name:c.horizon.clock,unit:c.horizon.unit,now:15},verifiesJudgment:()=>false};}
/** A test-only signature/coverage adapter; not a substitute for native admission. Private key remains in this closure. */
export function action(place:string,result=hash('result')){
 const key=generateKeyPairSync('ed25519');const statement:ActionStatement={verb:'write',request:hash('request'),result,key:'writer',place,region:place+'/records',before:hash('before'),policy:hash('policy'),catalog:hash('catalog'),standingContract:hash('standing')};
 const signed=(f:Record<string,string>)=>canonical({...f,sig:'ed25519:'+sign(null,Buffer.from(signedBytes(f)),key.privateKey).toString('base64')});
 const scope=place+'/action-statement';
 const verifies=(line:string)=>{const p=parse(line);if(p.kind!=='fact'||p.value.fields.by!=='writer'||!p.value.fields.sig?.startsWith('ed25519:'))return false;return verify(null,Buffer.from(signedBytes(p.value.fields)),key.publicKey,Buffer.from(p.value.fields.sig.slice(8),'base64'));};
 const native:ActResultContract={scope:place+'/commit',context:'receipt:'+place,digest:hash,admitsRecord:(line)=>{const p=parse(line);return p.kind==='fact'&&p.value.fields.scope===scope&&verifies(line);},verifiesReceipt:verifies};
 const records=[signed({scope,role:'writes',form:'alphabet',measure:'digest',value:hash(actionStatementBytes(statement,budget)+'\n'),by:'writer',epoch:'7',at:'place:'+place})];
 const identity=actIdentity(records,native),receipt=signed({scope:native.scope,role:'writes',form:'alphabet',measure:'digest',value:identity,at:native.context,by:'writer',epoch:'7'});
 const packet:ActionReceipt={statement,act:identity,evidence:hash(receipt+'\n')};
 return {publicKey:key.publicKey.export({type:'spki',format:'der'}).toString('base64'),packet,records,receipt,context:{native,statementScope:scope,expectedStatement:statement}};
}
