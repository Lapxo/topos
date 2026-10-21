import {byBytes,canonical,parse} from '../wire/line.ts';
import {alphabetOfForm} from '../forms/alphabet.ts';
import {under} from '../authority/admit.ts';
export const CI_FORM_PROFILE='topos-ci/1' as const;
export interface CiDeclaration {readonly workflow:string;readonly projection:string;readonly job:string;readonly runsOn:string;readonly node:number;readonly artifact:string;readonly keyClass:'attest';readonly coverage:readonly string[];readonly witness:string;readonly provenance:string;readonly evidence:{readonly kind:'unobserved'}|{readonly kind:'reported';readonly run:string;readonly receipt:string}}
export interface CiContext {readonly workflowBytes:Uint8Array;readonly projectionBytes:Uint8Array;readonly artifacts:ReadonlyMap<string,Uint8Array>;readonly digestBytes:(bytes:Uint8Array)=>string}
const fail=(s:string):never=>{throw Error('REFUSE·ci-form '+s);};
const hash=(x:unknown):x is string=>typeof x==='string'&&/^sha256:[0-9a-f]{64}$/.test(x);
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000\r\n]/.test(x);
const object=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function keys(x:object,names:readonly string[]){if(Object.keys(x).some(k=>!names.includes(k)))return fail('fields');}
function scopes(x:readonly string[]){if(!Array.isArray(x)||!x.length||new Set(x).size!==x.length||x.some(s=>!text(s)||/[\s*?#\\]/.test(s)||s.split('/').some(p=>p===''||p==='.'||p==='..')))return fail('limited coverage');return [...x].sort(byBytes);}
function fields(d:CiDeclaration):Record<string,string>{
 if(!object(d))return fail('declaration');keys(d,['workflow','projection','job','runsOn','node','artifact','keyClass','coverage','witness','provenance','evidence']);
 if(!hash(d.workflow)||!hash(d.projection)||!hash(d.artifact))return fail('content identity');if(!text(d.job)||!text(d.runsOn)||!Number.isSafeInteger(d.node)||d.node<1||!text(d.provenance))return fail('pipeline declaration');
 if(d.keyClass!=='attest')return fail('attest class');if(!text(d.witness)||!d.witness.startsWith('witness:')||d.witness.length===8)return fail('witness');if(d.witness.includes('/'))return fail('witness slash has step semantics; opaque namespace requires another profile');if(!/^witness:[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(d.witness))return fail('witness');
 if(!object(d.evidence))return fail('execution evidence');if(d.evidence.kind==='unobserved')keys(d.evidence,['kind']);else if(d.evidence.kind==='reported'){keys(d.evidence,['kind','run','receipt']);if(!text(d.evidence.run)||!hash(d.evidence.receipt))return fail('execution evidence');}else return fail('execution evidence');
 return{workflow:d.workflow,projection:d.projection,job:d.job,'runs-on':d.runsOn,node:String(d.node),artifact:d.artifact,'key-class':d.keyClass,coverage:JSON.stringify(scopes(d.coverage)),witness:d.witness,provenance:d.provenance,evidence:JSON.stringify(d.evidence.kind==='unobserved'?{kind:'unobserved'}:{kind:'reported',run:d.evidence.run,receipt:d.evidence.receipt})};
}
export function encodeCiDeclaration(d:CiDeclaration):string{return CI_FORM_PROFILE+canonical(fields(d)).slice('bound-lock/1'.length);}
export function decodeCiDeclaration(line:string):CiDeclaration{
 if(!line.startsWith(CI_FORM_PROFILE+' '))return fail('profile');const got=parse('bound-lock/1'+line.slice(CI_FORM_PROFILE.length));if(got.kind!=='fact')return fail('record');const f=got.value.fields;keys(f,['workflow','projection','job','runs-on','node','artifact','key-class','coverage','witness','provenance','evidence']);let coverage:readonly string[],evidence:CiDeclaration['evidence'];try{coverage=JSON.parse(f.coverage!);evidence=JSON.parse(f.evidence!);}catch{return fail('JSON field');}
 const d={workflow:f.workflow!,projection:f.projection!,job:f.job!,runsOn:f['runs-on']!,node:Number(f.node),artifact:f.artifact!,keyClass:f['key-class'] as 'attest',coverage,witness:f.witness!,provenance:f.provenance!,evidence};if(encodeCiDeclaration(d)!==line)return fail('canonical bytes');return d;
}
function one(tokens:readonly string[],value:string,cause:string){try{const mask=alphabetOfForm.parse({tokens},value),members=mask.members(tokens);if(members.length!==1||members[0]!==value)return fail(cause);}catch{return fail(cause);}}
export function inspectCiDeclaration(input:CiDeclaration,ctx:CiContext){
 const d=decodeCiDeclaration(encodeCiDeclaration(input));if(ctx.digestBytes(ctx.workflowBytes)!==d.workflow||ctx.digestBytes(ctx.projectionBytes)!==d.projection)return fail('handed input digest');let p:Record<string,unknown>;try{p=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(ctx.projectionBytes));}catch{return fail('projection document');}
 if(!object(p)||p.workflowDigest!==d.workflow||p.job!==d.job||p.runsOnExpression!=='${{ matrix.os }}'||p.artifactDigest!==d.artifact)return fail('selected pipeline binding');
 if(!Array.isArray(p.runners)||!p.runners.length||p.runners.some(x=>!text(x))||!Array.isArray(p.nodes)||!p.nodes.length||p.nodes.some(x=>!Number.isSafeInteger(x)||Number(x)<1)||!Array.isArray(p.allowedCoverage))return fail('selected pipeline domain');
 one(p.runners as string[],d.runsOn,'runner outside declared matrix');one(p.nodes.map(String),String(d.node),'node outside declared matrix');const allowed=scopes(p.allowedCoverage as string[]);for(const scope of d.coverage)if(!allowed.some(prefix=>under(prefix,scope)))return fail('outside selected coverage '+scope);
 const needs:string[]=[];for(const id of [d.artifact,...d.evidence.kind==='reported'?[d.evidence.receipt]:[]]){const bytes=ctx.artifacts.get(id);if(bytes===undefined)needs.push('bytes:'+id);else if(ctx.digestBytes(bytes)!==id)return fail('artifact digest');}
 return{status:needs.length?'open' as const:'declared' as const,declaration:d,needs:needs.sort(byBytes),coverageStatus:'declared only' as const,authority:'not established' as const,execution:'not established' as const,evidence:d.evidence.kind==='reported'?'reported-unverified' as const:'unobserved' as const,needsVerification:['selected producer extraction','CI execution and artifact binding','attestation authenticity and actual coverage'],statisticalConfidence:'not applicable' as const};
}
