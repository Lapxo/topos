import {byBytes,canonical,parse} from '../wire/line.ts';
import {matches} from '../wire/classes.ts';
import {standingBytes} from './standing.ts';
import type {StandingTopos} from './standing.ts';

export interface ProviderInputs {
 readonly standing:string;
 readonly artifact:string;
 readonly digest:string;
 readonly lines:readonly string[];
}

/** The selector vocabulary belongs to Topos, including the offer-relative coordinates. */
export function providerInputRegions(topos:StandingTopos,offer:string):readonly string[] {
 const prefix=`${offer}/inputs/`;
 return [...new Set(topos.parts.filter(part=>part.scope?.startsWith(prefix)&&part.measure==='reads').map(part=>part.scope!.slice(prefix.length)))].sort(byBytes);
}

/** Selected-world inputs are a separate semantic projection, never place observations or an authority override. */
export function providerInputs(topos:StandingTopos,pin:string,offer:string,artifact:string,region:string,hash:(bytes:string)=>string):ProviderInputs|undefined {
 const selectors=topos.parts.filter(part=>part.scope===`${offer}/inputs/${region}`&&part.measure==='reads');
 if(!selectors.length)return undefined;
 const contract=topos.parts.filter(part=>part.scope==='wire/provider-inputs'||part.scope==='audit/wire/provider-inputs');
 if(!contract.length||contract.some(part=>part.value!=='standing-projection@1'))throw Error(`REFUSE·wire ${offer} provider inputs need standing-projection@1`);
 const selected=new Set<string>();
 for(const selector of selectors){
  if(selector.role!=='reads'&&selector.role!=='demands')throw Error(`REFUSE·input ${selector.scope} needs a declared reads or demands role`);
  const masks=(selector.value??'').split('|').filter(Boolean);
  if(!masks.length)throw Error(`REFUSE·input ${selector.scope} has no selector`);
  const members=topos.lines.filter(line=>{const got=parse(line);return got.kind==='fact'&&masks.some(mask=>matches(mask,got.value.fields.scope??''));});
  if(selector.role==='demands'&&!members.length)throw Error(`REFUSE·input ${selector.scope} selects no required standing member`);
  for(const line of members)selected.add(line);
 }
 const bytes=selected.size?standingBytes([...selected]):'';
 const lines=bytes?bytes.trimEnd().split('\n').sort(byBytes):[];
 return {standing:pin,artifact,digest:hash(bytes),lines};
}

/** Syntax is preserved without flattening either source into the other. Verification of the named bytes belongs to the host. */
export function providerFields(input:ProviderInputs):{readonly standing:string;readonly artifact:string;readonly digest:string;readonly lines:readonly Readonly<Record<string,string>>[]} {
 const lines=input.lines.map(line=>{const got=parse(line);if(got.kind!=='fact'||canonical(got.value.fields)!==line)throw Error('REFUSE·input provider projection is not canonical');return got.value.fields;});
 return {...input,lines};
}
