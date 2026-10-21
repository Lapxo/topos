import {recordObject,recordText,recordCoordinate,recordDigest,recordLine,recordFields,recordCanonical,recordFail,type RecordBudget} from './record.ts';
export const ATTRIBUTED_ORIGIN_PROFILE='topos-attributed-origin/1' as const;
export const WRITTEN_REFUSAL_PROFILE='topos-written-refusal/1' as const;
export interface AttributedOrigin {readonly origin:string;readonly key:string;readonly scope:string;readonly context:string;readonly evidence?:string}
export interface WrittenRefusal {readonly producer:string;readonly code:string;readonly request:string;readonly scope:string;readonly context:string;readonly next:string;readonly evidence?:string}
function origin(input:AttributedOrigin){const r=recordObject(input,['origin','key','scope','context'],['evidence']);recordDigest(r.origin);recordDigest(r.context);recordText(r.key);recordCoordinate(r.scope);if(r.evidence!==undefined)recordDigest(r.evidence);return {...r} as unknown as AttributedOrigin;}
function refusal(input:WrittenRefusal){const r=recordObject(input,['producer','code','request','scope','context','next'],['evidence']);for(const k of ['producer','code','next'])recordText(r[k]);recordCoordinate(r.scope);recordDigest(r.request);recordDigest(r.context);if(r.evidence!==undefined)recordDigest(r.evidence);return {...r} as unknown as WrittenRefusal;}
export function encodeAttributedOrigin(input:AttributedOrigin,b:RecordBudget){return recordLine(ATTRIBUTED_ORIGIN_PROFILE,origin(input) as unknown as Record<string,string>,b);}
export function decodeAttributedOrigin(line:string,b:RecordBudget){const out=origin(recordFields(ATTRIBUTED_ORIGIN_PROFILE,line,b) as unknown as AttributedOrigin);recordCanonical(encodeAttributedOrigin(out,b),line);return out;}
export function originStatement(input:AttributedOrigin,b:RecordBudget){const {evidence,...r}=origin(input);return recordLine('topos-origin-statement/1',r,b);}
export function inspectAttributedOrigin(input:AttributedOrigin,b:RecordBudget){const r=decodeAttributedOrigin(encodeAttributedOrigin(input,b),b);return {status:'attributed' as const,origin:r,authentication:'not verified' as const,authorization:'not established' as const,needs:r.evidence===undefined?['origin/covering-evidence']:['origin/coverage-verification']};}
/** The consumer selects its own verifier and admitted key context. A data packet cannot choose either. */
export function authenticateOrigin(input:AttributedOrigin,ctx:{readonly key:string;readonly context:string;readonly verifiesCoverage:(statement:string,evidence:string,key:string,scope:string)=>boolean},b:RecordBudget){
 const r=decodeAttributedOrigin(encodeAttributedOrigin(input,b),b);if(!ctx||typeof ctx.verifiesCoverage!=='function')return recordFail('origin/consumer-context');
 if(r.key!==ctx.key||r.context!==ctx.context)return recordFail('origin/context');
 if(r.evidence===undefined||ctx.verifiesCoverage(originStatement(r,b),r.evidence,r.key,r.scope)!==true)return {status:'open' as const,needs:['origin/verified-coverage']};
 return {status:'authenticated-attribution' as const,origin:r,authorization:'not established' as const};
}
export function encodeWrittenRefusal(input:WrittenRefusal,b:RecordBudget){return recordLine(WRITTEN_REFUSAL_PROFILE,refusal(input) as unknown as Record<string,string>,b);}
export function decodeWrittenRefusal(line:string,b:RecordBudget){const out=refusal(recordFields(WRITTEN_REFUSAL_PROFILE,line,b) as unknown as WrittenRefusal);recordCanonical(encodeWrittenRefusal(out,b),line);return out;}
