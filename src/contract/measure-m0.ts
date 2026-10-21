import {byBytes,canonical,parse} from '../wire/line.ts';
import {continuousForm} from '@lapxo/obligations';
export const M0_MEASURE_PROFILE='topos-measure-m0/1' as const;
export type RecordValue=Readonly<Record<string,unknown>>;
export interface M0Measure {readonly status:'unmeasured'|'declared';readonly reason?:string;readonly kind?:'population-moments'|'identification'|'keff-outer-enclosure'|'weight-participation';readonly model?:RecordValue;readonly observation?:RecordValue;readonly units?:string;readonly numerical?:RecordValue;readonly result?:RecordValue}
const fail=(s:string):never=>{throw Error('REFUSE·measure-m0 '+s);};
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000\r\n]/.test(x);
const prob=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1;
const int=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=1;
function keys(x:RecordValue,names:readonly string[],cause:string){if(Object.keys(x).some(k=>!names.includes(k)))fail(cause);}
function json(x:unknown):string {if(x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'&&Number.isFinite(x))return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(json).join(',')+']';if(obj(x))return '{'+Object.keys(x).sort(byBytes).map(k=>JSON.stringify(k)+':'+json(x[k])).join(',')+'}';return fail('JSON value');}
function independence(x:unknown){if(!obj(x)||x.kind!=='joint-independence'||x.scope!=='latent-lineages-and-fresh-draws'||!text(x.provenance))return fail('joint independence declaration');keys(x,['kind','scope','provenance'],'independence fields');}
function weights(x:unknown,tol:number):number|undefined {if(!obj(x))return fail('weights');if(x.family==='uniform'){keys(x,['family','K'],'weights fields');if(x.K==='unknown')return undefined;if(!int(x.K))return fail('K');return x.K;}if(x.family==='declared'){keys(x,['family','values'],'weights fields');if(!Array.isArray(x.values)||!x.values.length||x.values.some(v=>!prob(v)))return fail('weights');const w=x.values as number[];if(Math.abs(w.reduce((a,b)=>a+b,0)-1)>tol)return fail('normalized weights');return w.filter(v=>v>0).length;}return fail('weights family');}
function calibration(x:unknown,name:string){if(!obj(x))return fail('calibration '+name);keys(x,['box','failureUpper','provenance','coveragePremise','source'],'calibration fields');if(!Array.isArray(x.box)||x.box.length!==2||!x.box.every(prob)||x.box[0]<=0||x.box[0]>x.box[1]||(name==='p'&&x.box[1]>=1)||!prob(x.failureUpper)||!text(x.provenance)||!text(x.coveragePremise)||x.source!=='external')return fail('calibration '+name);}
export function inspectM0Measure(input:M0Measure){
 if(!obj(input))return fail('record');keys(input,['status','reason','kind','model','observation','units','numerical','result'],'fields');
 if(input.status==='unmeasured'){if(!text(input.reason)||Object.keys(input).some(k=>k!=='status'&&k!=='reason'))return fail('unmeasured reason only');return {status:'unmeasured' as const,reason:input.reason,certification:'not established' as const};}
 if(input.status!=='declared'||!obj(input.model)||!obj(input.observation)||!obj(input.numerical)||!obj(input.result)||input.reason!==undefined)return fail('complete numerical declaration');
 const m=input.model,o=input.observation,n=input.numerical,r=input.result;keys(m,['id','p','c','weights','jointIndependence','parameterProvenance'],'model fields');keys(n,['arithmetic','tolerance'],'numerical policy');
 if(n.arithmetic!=='binary64-declared'||typeof n.tolerance!=='number'||!Number.isFinite(n.tolerance)||n.tolerance<=0||n.tolerance>1e-9)return fail('numerical policy');
 if(!['binary-M0-population-agreement@1','binary-M0-uniform-population@1','binary-M0-whole-cell-iid@1'].includes(String(m.id)))return fail('published M0 model');
 independence(m.jointIndependence);if(!text(m.parameterProvenance))return fail('parameter provenance');const support=weights(m.weights,n.tolerance);
 let condition:string;
 if(input.kind==='population-moments'){
  if(m.id!=='binary-M0-population-agreement@1'||!prob(m.p)||!prob(m.c)||support===undefined||input.units!=='probability')return fail('population domain');keys(o,['design','moments','provenance'],'observation fields');if(o.design!=='conditional-population-iid-with-replacement'||json(o.moments)!=='["R2","R4"]'||!text(o.provenance))return fail('population moments');keys(r,['R2','R4'],'result fields');if(!prob(r.R2)||!prob(r.R4))return fail('moment range');condition='Declared population pair/fourth agreement only; not a complete observable law, error rate or inverse';
 }else if(input.kind==='identification'){
  if(!prob(m.p)||m.p<=0||m.p>=1||m.c!=='unknown-in-(0,1]'||input.units!=='dimensionless')return fail('identification domain');keys(o,['design','moments','provenance'],'observation fields');if(o.design!=='population-expectation'||!obj(o.moments)||!prob(o.moments.R2)||!prob(o.moments.R4)||!text(o.provenance))return fail('population inverse');keys(o.moments,['R2','R4'],'selected moments');
  if(m.id==='binary-M0-uniform-population@1'&&obj(m.weights)&&m.weights.family==='uniform'&&m.weights.K==='unknown'){
   keys(r,['kind','c','K'],'result fields');if(r.kind!=='unique-within-uniform-family'||!prob(r.c)||r.c<=0||!int(r.K))return fail('uniform inverse result');condition='Uniqueness theorem applies only to exact population moments, known p and declared uniform family; supplied inverse is not recomputed';
  }else if(m.id==='binary-M0-population-agreement@1'){
   if(r.kind!=='compatible-set'||json(r.constraints)!=='["R2","R4"]')return fail('nonuniform compatible set');keys(r,['kind','constraints'],'result fields');condition='Set defined by declared R2/R4 equations; not a singleton or an enumerated/exhaustive solver output';
  }else return fail('identification family');
 }else if(input.kind==='keff-outer-enclosure'){
  if(m.id!=='binary-M0-whole-cell-iid@1'||m.p!=='external-box'||m.c!=='external-box'||support===undefined||input.units!=='dimensionless')return fail('finite domain');
  keys(o,['design','cellUnit','T','N','Dhat','independence','provenance','epsilon','calibration','uncertaintyUnit'],'observation fields');
  if(o.design!=='conditional-population-iid-with-replacement'||o.cellUnit!=='whole-complete-cell'||o.uncertaintyUnit!=='whole-cells'||o.independence!=='joint-iid-complete-cells'||!int(o.T)||!int(o.N)||o.N<2||!prob(o.Dhat)||!text(o.provenance)||!prob(o.epsilon)||o.epsilon<=0)return fail('whole-cell sampling');
  if(!obj(o.calibration))return fail('external calibration required');keys(o.calibration,['p','c'],'calibration fields');calibration(o.calibration.p,'p');calibration(o.calibration.c,'c');
  keys(r,['kind','lower','upper','denominator','cap','errorBudgets'],'result fields');if(r.kind!=='conditional-outer-enclosure'||typeof r.lower!=='number'||!Number.isFinite(r.lower)||r.lower<1||!(r.upper===null||typeof r.upper==='number'&&Number.isFinite(r.upper)&&r.upper>=r.lower))return fail('enclosure');
  if(r.denominator!=='strictly-positive-premise'&&r.denominator!=='may-approach-zero')return fail('denominator premise');
  if(r.cap!==null){if(!obj(r.cap)||r.cap.kind!=='known-deterministic'||typeof r.cap.value!=='number'||!Number.isFinite(r.cap.value)||r.cap.value<1||!text(r.cap.provenance))return fail('external cap');keys(r.cap,['kind','value','provenance'],'cap fields');if(r.upper!==null&&r.upper>r.cap.value)return fail('cap bound');}
  if(r.denominator==='may-approach-zero'&&r.upper!==null&&r.cap===null)return fail('no finite upper bound');
  if(!obj(r.errorBudgets)||!prob(r.errorBudgets.data)||!prob(r.errorBudgets.p)||!prob(r.errorBudgets.c)||r.errorBudgets.method!=='union-bound')return fail('joint error budgets');keys(r.errorBudgets,['data','p','c','method'],'budget fields');if(r.errorBudgets.p!==(o.calibration.p as RecordValue).failureUpper||r.errorBudgets.c!==(o.calibration.c as RecordValue).failureUpper)return fail('calibration budgets');condition='Conditional declared outer enclosure; pairs share members; coverage/calibration and numerical enclosure require external verification; no finite upper bound if denominator approaches zero without cap';
 }else if(input.kind==='weight-participation'){
  if(m.id!=='binary-M0-population-agreement@1'||!prob(m.p)||!prob(m.c)||support===undefined||input.units!=='dimensionless')return fail('participation domain');keys(o,['design','provenance'],'observation fields');if(o.design!=='declared-normalized-weights'||!text(o.provenance))return fail('participation observation');keys(r,['kind','lower','upper'],'result fields');if(r.kind!=='declared-weight-participation'||typeof r.lower!=='number'||typeof r.upper!=='number'||!Number.isFinite(r.lower)||!Number.isFinite(r.upper)||r.lower<1||r.lower>r.upper||r.upper>support)return fail('participation bound');condition='Published concentration definition 1/sum(w_i^2); supported range only, not recomputed and not a count of causally independent sources';
 }else return fail('measure kind');
 return {status:'declared' as const,condition,certification:'not established' as const,resultStatus:'declared-not-recomputed' as const,needsVerification:['model premises','numerical result','observation/calibration provenance'],record:input};
}
export function encodeM0Measure(input:M0Measure):string{inspectM0Measure(input);return M0_MEASURE_PROFILE+canonical({record:json(input)}).slice('bound-lock/1'.length);}
export function decodeM0Measure(line:string):M0Measure{if(!line.startsWith(M0_MEASURE_PROFILE+' '))return fail('profile');const got=parse('bound-lock/1'+line.slice(M0_MEASURE_PROFILE.length));if(got.kind!=='fact'||Object.keys(got.value.fields).join('|')!=='record')return fail('record');let x:M0Measure;try{x=JSON.parse(got.value.fields.record);}catch{return fail('JSON record');}if(encodeM0Measure(x)!==line)return fail('canonical bytes');return x;}
/** Comparison of declarations, not a verification of their statistical conclusions. */
export function m0MeasureRefines(a:M0Measure,b:M0Measure):boolean{inspectM0Measure(a);inspectM0Measure(b);if(a.status==='unmeasured'||b.status==='unmeasured')return json(a)===json(b);const context=(x:M0Measure)=>json({...x,result:null});if(context(a)!==context(b))return false;const x=a.result!,y=b.result!;
 if(a.kind==='weight-participation'){const L=continuousForm.lattice({lo:1,hi:Infinity});return L.leq({lo:x.lower as number,hi:x.upper as number},{lo:y.lower as number,hi:y.upper as number});}
 return json(x)===json(y);
}
