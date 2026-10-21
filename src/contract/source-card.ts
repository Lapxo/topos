import {byBytes,canonical,parse} from '../wire/line.ts';
import {budgetForm} from '../forms/budget.ts';
import type {WireForm} from '../forms/form.ts';
export const SOURCE_CARD_PROFILE='topos-source-card/1' as const;
export interface SourceCard {readonly source:string;readonly publisher:string;readonly catalog:string;readonly form:string;readonly params:string;readonly resolution:string;readonly authority:string;readonly cost:string;readonly 'cost-unit':string;readonly 'cost-limit':string;readonly needs:string;readonly shares?:string;readonly [key:string]:string|undefined}
/** The selected provider binds these decoders to this content identity; a digest alone is not decoder authentication. */
export interface SourceCardCatalog {readonly digest:string;readonly forms:ReadonlyMap<string,WireForm>}
const fail=(s:string):never=>{throw Error('REFUSE·source-card '+s);};
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const word=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000-\u0020\u007f]/.test(x);
function json(x:unknown):string{if(x===null||typeof x==='boolean'||typeof x==='string'||typeof x==='number'&&Number.isFinite(x))return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(json).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort(byBytes).map(k=>JSON.stringify(k)+':'+json((x as Record<string,unknown>)[k])).join(',')+'}';return fail('parameters');}
function normalized(c:SourceCard):Record<string,string>{
 const out:Record<string,string>={};for(const [k,v]of Object.entries(c)){if(!/^[a-z][a-z0-9-]*$/.test(k)||typeof v!=='string'||/[\u0000\r\n]/.test(v))return fail('fields');out[k]=v;}
 for(const k of ['source','publisher','authority'])if(!word(c[k]))return fail(k);
 if(['by','sig','epoch','type'].some(k=>own(c,k)))return fail('protocol envelope');
 if(!/^sha256:[0-9a-f]{64}$/.test(c.catalog)||!word(c.form))return fail('catalog/form');
 let p:unknown;try{p=JSON.parse(c.params);}catch{return fail('parameters');}if(!p||typeof p!=='object'||Array.isArray(p))return fail('parameters');out.params=json(p);
 if(!word(c['cost-unit'])||!/^\d+(?:\.\d+)?$/.test(c['cost-limit'])||!Number.isFinite(Number(c['cost-limit']))||Number(c['cost-limit'])<=0||String(Number(c['cost-limit']))!==c['cost-limit'])return fail('cost declaration');
 for(const k of ['needs','shares']){if(k==='shares'&&!own(c,k))continue;const v=c[k];if(!word(v)||v.split('|').some(x=>!word(x)))return fail(k);out[k]=[...new Set(v.split('|'))].sort(byBytes).join('|');}
 if(typeof c.resolution!=='string'||!c.resolution||typeof c.cost!=='string'||!c.cost)return fail('resolution/cost');
 return out;
}
export function encodeSourceCard(card:SourceCard):string{return SOURCE_CARD_PROFILE+canonical(normalized(card)).slice('bound-lock/1'.length);}
export function decodeSourceCard(line:string):SourceCard{if(!line.startsWith(SOURCE_CARD_PROFILE+' '))return fail('profile');const got=parse('bound-lock/1'+line.slice(SOURCE_CARD_PROFILE.length));if(got.kind!=='fact')return fail('record');const c=got.value.fields as SourceCard;if(encodeSourceCard(c)!==line)return fail('canonical bytes');return Object.freeze({...c});}
export function inspectSourceCard(card:SourceCard,catalog:SourceCardCatalog){
 const c=decodeSourceCard(encodeSourceCard(card));if(c.catalog!==catalog.digest)return fail('catalog identity');const form=catalog.forms.get(c.form);if(!form||form.id!==c.form)return fail('uncatalogued form');const params:unknown=JSON.parse(c.params),L=form.lattice(params),value=form.parse(params,c.resolution);if(form.emit(params,value)!==c.resolution)return fail('resolution canonical');if(L.leq(value,L.bottom))return fail('empty resolution');if(!L.leq(value,L.top))return fail('resolution domain');
 const budget={lo:0,hi:Number(c['cost-limit'])};let cost:ReturnType<typeof budgetForm.parse>;try{cost=budgetForm.parse(budget,c.cost);}catch{return fail('cost syntax');}if(cost.lo<0||cost.hi>budget.hi||cost.lo>cost.hi||!Number.isFinite(cost.lo)||!Number.isFinite(cost.hi))return fail('cost domain');if(budgetForm.emit(budget,cost)!==c.cost)return fail('cost canonical');
 return {card:c,resolution:value,cost,sharedCause:c.shares===undefined?{kind:'unknown' as const,independence:'not established' as const}:{kind:'declared' as const,shares:c.shares,independence:'not established' as const},authority:'declared; not authenticated' as const,needs:c.needs==='none'?[]:c.needs.split('|')};
}
/** Product refinement only within identical attribution/model/units/opaque extensions; no grant or cross-source aggregation. */
export function sourceCardRefines(a:SourceCard,b:SourceCard,catalog:SourceCardCatalog):boolean{
 const x=inspectSourceCard(a,catalog),y=inspectSourceCard(b,catalog),omit=(c:SourceCard)=>Object.fromEntries(Object.entries(c).filter(([k])=>k!=='resolution'&&k!=='cost'));
 if(canonical(omit(x.card) as Record<string,string>)!==canonical(omit(y.card) as Record<string,string>))return false;
 const form=catalog.forms.get(a.form)!,params:unknown=JSON.parse(a.params);return form.lattice(params).leq(x.resolution,y.resolution)&&budgetForm.lattice({lo:0,hi:Number(a['cost-limit'])}).leq(x.cost,y.cost);
}
