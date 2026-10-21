import {byBytes,canonical,parse} from '../wire/line.ts';

export const MODULE_INVENTORY_PROFILE='topos-inventory/1' as const;
export interface InventoryObservation {
 readonly source:string; readonly version:string; readonly holder:string;
 readonly unitKind:'module'; readonly unit:string; readonly reached:boolean;
 readonly reachedFrom?:{readonly digest:string;readonly selector:readonly string[]};
 readonly moduleBytes?:Uint8Array;
}
export interface InventoryEvidence {
 readonly documents:ReadonlyMap<string,Uint8Array>;
 /** Computes declared SHA-256; returns sha256:<64 lowercase hexadecimal digits>. */
 readonly digestBytes:(bytes:Uint8Array)=>string;
}
export interface InventoryRow {
 readonly source:string;readonly version:string;readonly holder:string;
 readonly 'unit-kind':'module';readonly unit:string;readonly 'reached-from':string;
 readonly status:'point'|'open';readonly digest?:string;readonly needs?:'digest';
}
const fail=(cause:string):never=>{throw Error('REFUSE·module-inventory '+cause);};
const hash=/^sha256:[0-9a-f]{64}$/;
const owns=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000\r\n]/.test(x);
function unit(x:unknown):x is string {
 return text(x)&&!/[\\\s?#]/.test(x)&&!x.startsWith('/')&&x.split('/').every(p=>p!==''&&p!=='.'&&p!=='..')&&/\.(?:[cm]?js|[cm]?ts|tsx)$/.test(x)&&!x.endsWith('.d.ts');
}
function identity(row:InventoryRow):void {
 if(!text(row.source)||!text(row.version)||!text(row.holder))fail('source/version/holder');
 if(row['unit-kind']!=='module'||!unit(row.unit))fail('module unit');
}
export function encodeInventoryRow(row:InventoryRow):string {
 identity(row);
 const keys=['source','version','holder','unit-kind','unit','reached-from','status','digest','needs'];
 if(Object.keys(row).some(k=>!keys.includes(k)))return fail('fields');
 if(!text(row['reached-from']))return fail('reached-from');
 const split=row['reached-from'].indexOf('#');
 if(split<0||!hash.test(row['reached-from'].slice(0,split)))return fail('reached-from');
 try{const selector=JSON.parse(decodeURIComponent(row['reached-from'].slice(split+1)));if(!Array.isArray(selector)||selector.length<1||selector[0]!=='exports'||!selector.every(text)||encodeURIComponent(JSON.stringify(selector))!==row['reached-from'].slice(split+1))return fail('reached-from');}catch{return fail('reached-from');}
 if(row.status==='point') {if(!row.digest||!hash.test(row.digest)||owns(row,'needs'))return fail('point digest');}
 else if(row.status==='open') {if(row.needs!=='digest'||owns(row,'digest'))return fail('open digest');}
 else return fail('status');
 return MODULE_INVENTORY_PROFILE+canonical(row as unknown as Record<string,string>).slice('bound-lock/1'.length);
}
export function decodeInventoryRow(line:string):InventoryRow {
 if(!line.startsWith(MODULE_INVENTORY_PROFILE+' '))return fail('profile');
 const got=parse('bound-lock/1'+line.slice(MODULE_INVENTORY_PROFILE.length));
 if(got.kind!=='fact')return fail('record');
 const row=got.value.fields as unknown as InventoryRow;
 if(encodeInventoryRow(row)!==line)return fail('canonical bytes');
 return Object.freeze({...row});
}
/** Pure projection from explicit selected export evidence; no discovery, admission or history fold. */
export function moduleInventory(observations:readonly InventoryObservation[],evidence:InventoryEvidence):readonly string[] {
 const lines:string[]=[];
 for(const x of observations){
  identity({'source':x.source,'version':x.version,holder:x.holder,'unit-kind':x.unitKind,unit:x.unit,'reached-from':'',status:'open',needs:'digest'});
  if(typeof x.reached!=='boolean')return fail('reach declaration');
  if(!x.reached)continue;
  const proof=x.reachedFrom;
  if(!proof||!hash.test(proof.digest)||!Array.isArray(proof.selector)||proof.selector.length<1||proof.selector[0]!=='exports'||!proof.selector.every(text))return fail('reach evidence');
  const bytes=evidence.documents.get(proof.digest);
  if(!bytes||evidence.digestBytes(bytes)!==proof.digest)return fail('evidence digest');
  let document:unknown;try{document=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));}catch{return fail('evidence document');}
  if(document===null||typeof document!=='object'||Array.isArray(document))return fail('package identity');
  const pkg=document as Record<string,unknown>;
  if(pkg.name!==x.source||pkg.version!==x.version)return fail('package identity');
  let selected:unknown=document;
  for(const key of proof.selector){if(selected===null||typeof selected!=='object'||Array.isArray(selected)||!owns(selected,key))return fail('unproved reachability');selected=(selected as Record<string,unknown>)[key];}
  if(selected!=='./'+x.unit)return fail('unproved reachability');
  const common={source:x.source,version:x.version,holder:x.holder,'unit-kind':'module' as const,unit:x.unit,'reached-from':proof.digest+'#'+encodeURIComponent(JSON.stringify(proof.selector))};
  if(x.moduleBytes===undefined)lines.push(encodeInventoryRow({...common,status:'open',needs:'digest'}));
  else {if(!(x.moduleBytes instanceof Uint8Array))return fail('module bytes');const digest=evidence.digestBytes(x.moduleBytes);if(!hash.test(digest))return fail('digest algorithm');lines.push(encodeInventoryRow({...common,status:'point',digest}));}
 }
 return [...new Set(lines)].sort(byBytes);
}
export function inventoryBytes(lines:readonly string[]):string {
 for(const line of lines)decodeInventoryRow(line);
 const set=[...new Set(lines)].sort(byBytes);
 return set.length?set.join('\n')+'\n':'';
}
/** Exact line-set delta, bounded explicitly; it neither withdraws nor admits anything. */
export function inventoryDiff(before:readonly string[],after:readonly string[],maxChanges:number){
 if(!Number.isSafeInteger(maxChanges)||maxChanges<0)return fail('diff budget');
 const a=new Set(inventoryBytes(before).split('\n').filter(Boolean)),b=new Set(inventoryBytes(after).split('\n').filter(Boolean));
 const changes=[...[...a].filter(x=>!b.has(x)).map(line=>({operation:'remove' as const,line})),...[...b].filter(x=>!a.has(x)).map(line=>({operation:'add' as const,line}))].sort((x,y)=>byBytes(x.line,y.line)||byBytes(x.operation,y.operation));
 return {changes:changes.slice(0,maxChanges),omitted:Math.max(0,changes.length-maxChanges),unchanged:[...a].filter(x=>b.has(x)).length};
}
