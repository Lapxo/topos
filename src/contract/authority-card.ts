import {byBytes} from '../wire/line.ts';
import {normalizeRegistryHorizon,type RegistryHorizon} from './registry-place.ts';
import {recordObject,recordText,recordCoordinate,recordDigest,recordList,recordNames,recordLine,recordFields,recordJSON,recordCanonical,recordFail,type RecordBudget} from './record.ts';
export const AUTHORITY_CARD_PROFILE='topos-authority-card/1' as const;
export interface AuthorityCard {
 readonly place:string;readonly snapshot:string;readonly key:string;readonly authority:string;readonly coverage:string;
 readonly policy:string;readonly budget:string;readonly catalog:string;readonly standingContract:string;
 readonly grants:readonly string[];readonly retirements:readonly string[];readonly demands:readonly string[];
 readonly horizon:RegistryHorizon;readonly issuedAt:number;
 readonly actions:readonly {readonly request:string;readonly decision:'allow'|'ask'|'deny'}[];
 readonly evidence:string;
}
const scalar=['place','snapshot','key','authority','coverage','policy','budget','catalog','standingContract','issuedAt','grants','retirements','demands','horizon','actions','evidence'] as const;
const digestFields=['snapshot','authority','coverage','policy','budget','catalog','standingContract','evidence'] as const;
function checked(input:AuthorityCard,b:RecordBudget):AuthorityCard{
 const r=recordObject(input,scalar),out={...r} as unknown as AuthorityCard;
 recordCoordinate(r.place);recordText(r.key);for(const k of digestFields)recordDigest(r[k]);
 const horizon=normalizeRegistryHorizon(out.horizon);if(!Number.isSafeInteger(r.issuedAt)||out.issuedAt<horizon.from||out.issuedAt>horizon.through)return recordFail('authority-card/clock');
 const actions=recordList(r.actions,b,x=>{const a=recordObject(x,['request','decision']);recordDigest(a.request);if(!['allow','ask','deny'].includes(String(a.decision)))return recordFail('authority-card/decision');return {request:a.request as string,decision:a.decision as 'allow'|'ask'|'deny'};}).sort((a,c)=>byBytes(a.request,c.request));
 if(new Set(actions.map(a=>a.request)).size!==actions.length)return recordFail('authority-card/duplicate-action');
 return {...out,horizon,actions,grants:recordNames(r.grants,b,recordDigest),retirements:recordNames(r.retirements,b,recordDigest),demands:recordNames(r.demands,b,recordDigest)};
}
function fields(c:AuthorityCard):Record<string,string>{return Object.fromEntries(scalar.map(k=>[k,typeof c[k]==='string'?c[k]:JSON.stringify(c[k])])) as Record<string,string>;}
export function encodeAuthorityCard(input:AuthorityCard,b:RecordBudget):string{return recordLine(AUTHORITY_CARD_PROFILE,fields(checked(input,b)),b);}
export function decodeAuthorityCard(line:string,b:RecordBudget):AuthorityCard{
 const f=recordFields(AUTHORITY_CARD_PROFILE,line,b);recordObject(f,scalar);const out=checked({...f,...Object.fromEntries(['grants','retirements','demands','horizon','actions','issuedAt'].map(k=>[k,recordJSON(f[k]!)]))} as unknown as AuthorityCard,b);recordCanonical(encodeAuthorityCard(out,b),line);return out;
}
/** The external judge's proof covers the statement, excluding its own evidence digest. */
export function authorityCardStatement(input:AuthorityCard,b:RecordBudget):string{const {evidence,...f}=fields(checked(input,b));return recordLine('topos-authority-statement/1',f,b);}
export function inspectAuthorityCard(input:AuthorityCard,b:RecordBudget){return {status:'declared' as const,card:decodeAuthorityCard(encodeAuthorityCard(input,b),b),authentication:'not verified' as const,authorization:'not established' as const};}
export interface AuthorityCardContext {
 readonly place:string;readonly snapshot:string;readonly key:string;readonly authority:string;readonly coverage:string;
 readonly policy:string;readonly budget:string;readonly catalog:string;readonly standingContract:string;
 readonly clock:{readonly name:string;readonly unit:string;readonly now:number};
 /** Selected by the consumer, never supplied by card bytes. Must verify the actual judgment and all coverage/context bindings. */
 readonly verifiesJudgment:(statement:string,evidence:string)=>boolean;
}
export function authorityCardAnswer(input:AuthorityCard,request:string,ctx:AuthorityCardContext,b:RecordBudget){
 const c=decodeAuthorityCard(encodeAuthorityCard(input,b),b);recordDigest(request);
 const stale=()=>({status:'refused' as const,code:'card-stale' as const,next:'refresh-card' as const});
 if(!ctx||!ctx.clock||typeof ctx.verifiesJudgment!=='function')return recordFail('authority-card/consumer-context');
 for(const k of ['place','snapshot','key','authority','coverage','policy','budget','catalog','standingContract'] as const)if(c[k]!==ctx[k])return stale();
 if(ctx.clock.name!==c.horizon.clock||ctx.clock.unit!==c.horizon.unit||!Number.isSafeInteger(ctx.clock.now)||ctx.clock.now<c.issuedAt||ctx.clock.now>c.horizon.through)return stale();
 const action=c.actions.find(a=>a.request===request);if(!action)return {status:'refused' as const,code:'not-in-card' as const,next:'request-card-entry' as const};
 if(ctx.verifiesJudgment(authorityCardStatement(c,b),c.evidence)!==true)return {status:'open' as const,needs:['authority-card/verified-judgment'] as const};
 return {status:'observed' as const,decision:action.decision,source:'consumer-verified-judgment' as const};
}
