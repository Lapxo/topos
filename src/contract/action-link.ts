import {actResultOf,type ActResultContract} from '../wire/act-result.ts';
import {parse} from '../wire/line.ts';
import {decodeLocatedReference,encodeLocatedReference,locatedReferenceIdentity,inspectLocatedReference,type ReferenceInspection} from './reference-location.ts';
import {recordObject,recordText,recordCoordinate,recordDigest,recordList,recordLine,recordFields,recordCanonical,recordFail,type RecordBudget} from './record.ts';
export const ACTION_RECEIPT_PROFILE='topos-action-receipt/1' as const;
export const AUTHENTICATED_LINK_PROFILE='topos-authenticated-link/1' as const;
export interface ActionStatement {readonly verb:string;readonly request:string;readonly result:string;readonly key:string;readonly place:string;readonly region:string;readonly before:string;readonly policy:string;readonly catalog:string;readonly standingContract:string}
export interface ActionReceipt {readonly statement:ActionStatement;readonly act:string;readonly evidence:string}
export interface ActionLink {readonly emitter:string;readonly region:string;readonly reference:string;readonly action:ActionReceipt}
const statementKeys=['verb','request','result','key','place','region','before','policy','catalog','standingContract'] as const;
function statement(input:ActionStatement){const r=recordObject(input,statementKeys);for(const k of ['verb','key'])recordText(r[k]);for(const k of ['place','region'])recordCoordinate(r[k]);for(const k of ['request','result','before','policy','catalog','standingContract'])recordDigest(r[k]);return {...r} as unknown as ActionStatement;}
export function actionStatementBytes(input:ActionStatement,b:RecordBudget){return recordLine('topos-action-statement/1',statement(input) as unknown as Record<string,string>,b);}
function packet(input:ActionReceipt){const r=recordObject(input,['statement','act','evidence']);recordDigest(r.act);recordDigest(r.evidence);return {statement:statement(r.statement as ActionStatement),act:r.act as string,evidence:r.evidence as string};}
export function encodeActionReceipt(input:ActionReceipt,b:RecordBudget){const r=packet(input);return recordLine(ACTION_RECEIPT_PROFILE,{statement:actionStatementBytes(r.statement,b),act:r.act,evidence:r.evidence},b);}
export function decodeActionReceipt(line:string,b:RecordBudget){const f=recordFields(ACTION_RECEIPT_PROFILE,line,b);recordObject(f,['statement','act','evidence']);const s=statement(recordFields('topos-action-statement/1',f.statement!,b) as unknown as ActionStatement);const out=packet({statement:s,act:f.act!,evidence:f.evidence!});recordCanonical(encodeActionReceipt(out,b),line);return out;}
export function inspectActionReceipt(input:ActionReceipt,b:RecordBudget){return {status:'declared' as const,receipt:decodeActionReceipt(encodeActionReceipt(input,b),b),authentication:'not verified' as const,effects:'not performed' as const};}
export interface ActionReceiptContext {
 readonly native:ActResultContract;readonly statementScope:string;readonly expectedStatement:ActionStatement;
}
/** Existing native act authentication, plus exact statement binding. Never commits or folds policy. */
export function verifyActionReceipt(input:ActionReceipt,records:readonly string[],receipt:string,ctx:ActionReceiptContext,b:RecordBudget){
 recordList(records,b,x=>{if(typeof x!=='string')return recordFail('action/records');return x;});
 if(typeof receipt!=='string'||records.reduce((n,s)=>n+s.length,receipt.length)>b.bytes||records.reduce((n,s)=>n+new TextEncoder().encode(s).length,new TextEncoder().encode(receipt).length)>b.bytes)return recordFail('action/bytes');
 if(!ctx||!ctx.native||typeof ctx.native.digest!=='function'||typeof ctx.native.admitsRecord!=='function'||typeof ctx.native.verifiesReceipt!=='function')return recordFail('action/consumer-context');recordCoordinate(ctx.statementScope);
 const p=decodeActionReceipt(encodeActionReceipt(input,b),b),bytes=actionStatementBytes(p.statement,b);
 if(!ctx||bytes!==actionStatementBytes(ctx.expectedStatement,b))return recordFail('action/context');
 const result=actResultOf(records,receipt,ctx.native);
 if(result.identity!==p.act||recordDigest(ctx.native.digest(receipt+'\n'))!==p.evidence)return recordFail('action/receipt-binding');
 const commits=result.records.flatMap(line=>{const got=parse(line);return got.kind==='fact'&&got.value.fields.scope===ctx.statementScope?[got.value.fields]:[];});
 if(commits.length!==1||commits[0]!.by!==p.statement.key||commits[0]!.role!=='writes'||commits[0]!.form!=='alphabet'||commits[0]!.measure!=='digest'||commits[0]!.value!==ctx.native.digest(bytes+'\n'))return recordFail('action/statement-binding');
 return {status:'authenticated-action' as const,statement:p.statement,result,effects:'not performed' as const};
}
function link(input:ActionLink,b:RecordBudget){const r=recordObject(input,['emitter','region','reference','action']);recordText(r.emitter);recordCoordinate(r.region);const ref=decodeLocatedReference(recordText(r.reference));return {emitter:r.emitter as string,region:r.region as string,reference:encodeLocatedReference(ref),action:decodeActionReceipt(encodeActionReceipt(r.action as ActionReceipt,b),b)};}
export function encodeActionLink(input:ActionLink,b:RecordBudget){const r=link(input,b);return recordLine(AUTHENTICATED_LINK_PROFILE,{emitter:r.emitter,region:r.region,reference:r.reference,action:encodeActionReceipt(r.action,b)},b);}
export function decodeActionLink(line:string,b:RecordBudget):ActionLink{const f=recordFields(AUTHENTICATED_LINK_PROFILE,line,b);recordObject(f,['emitter','region','reference','action']);const r=link({emitter:f.emitter!,region:f.region!,reference:f.reference!,action:decodeActionReceipt(f.action!,b)},b);recordCanonical(encodeActionLink(r,b),line);return r;}
export function verifyActionLink(input:ActionLink,records:readonly string[],receipt:string,ctx:ActionReceiptContext,bytes:Uint8Array|undefined,reference:ReferenceInspection,b:RecordBudget){
 const l=decodeActionLink(encodeActionLink(input,b),b),action=verifyActionReceipt(l.action,records,receipt,ctx,b),r=decodeLocatedReference(l.reference);
 if(l.emitter!==action.statement.key||l.region!==action.statement.region||action.statement.result!==ctx.native.digest(locatedReferenceIdentity(r)+'\n'))return recordFail('action/link-binding');
 const object=inspectLocatedReference(r,bytes,reference);
 return {status:'authenticated-link' as const,action,object,...(object.kind==='needs'?{needs:['needs/bytes/'+r.blob]}:{}),locationAuthentication:'not established' as const,objectAuthentication:'not demonstrated' as const};
}
