import {canonical,parse} from '../wire/line.ts';
import {matches} from '../wire/classes.ts';
import {semanticStandingBytes} from './semantic-projection.ts';
import type {StandingTopos} from './standing.ts';
import {readingIdentityBytes} from '../contract/reading-identity.ts';
import type {ReadingIdentityContext} from '../contract/reading-identity.ts';

export interface PlaceInputs {
 readonly profile:'admitted-place-inputs@1';
 readonly digest:string;
 readonly selectors:readonly string[];
 readonly lines:readonly string[];
}

/** Pure selective encoding, never admission or an authority decision. The host
 * supplies its authenticated, folded, live consumer shadow in effective order.
 * Provider inputs keep their existing selected-world meaning. */
export function placeInputs(world:StandingTopos,offer:string,region:string,live:readonly string[],hash:(bytes:Uint8Array)=>string):PlaceInputs|undefined {
 const selectors=world.parts.filter(part=>part.scope===`${offer}/place-inputs/${region}`&&part.measure==='reads');
 if(!selectors.length)return undefined;
 const profile=world.parts.filter(part=>part.scope==='wire/place-inputs');
 if(profile.length!==1||profile[0]!.role!=='writes'||profile[0]!.measure!=='id'||profile[0]!.value!=='admitted-place-inputs@1')throw Error('REFUSE·place inputs missing or conflicting profile '+offer);
 // Reuse semantic-standing@1: envelope excluded, exact duplicates removed,
 // effective order retained. It does not authenticate the caller's shadow.
 const canonicalLive=live.length?semanticStandingBytes(live).trimEnd().split('\n'):[];
 const selected=new Set<string>();
 for(const selector of selectors){
  if(selector.role!=='reads'&&selector.role!=='demands')throw Error('REFUSE·place inputs invalid selector role '+selector.scope);
  const masks=(selector.value??'').split('|').filter(Boolean);
  if(!masks.length)throw Error('REFUSE·place inputs empty selector '+selector.scope);
  const members=canonicalLive.filter(line=>{const got=parse(line);return got.kind==='fact'&&masks.some(mask=>matches(mask,got.value.fields.scope??''));});
  if(selector.role==='demands'&&!members.length)throw Error('REFUSE·place inputs required member absent '+selector.scope);
  for(const member of members)selected.add(member);
 }
 const lines=canonicalLive.filter(line=>selected.has(line));
 const declarations=semanticStandingBytes(selectors.map(fields=>canonical(fields))).trimEnd().split('\n');
 const bytes=new TextEncoder().encode(JSON.stringify(['admitted-place-inputs@1',declarations,lines])+'\n');
 return {profile:'admitted-place-inputs@1',digest:hash(bytes),selectors:declarations,lines};
}

/** Commit exactly the selected projection alongside existing verified inputs.
 * No environment, implementation, policy or current-answer reference is removed. */
export function withPlaceInputs(context:ReadingIdentityContext,coordinate:string,input:PlaceInputs):ReadingIdentityContext {
 const result={...context,inputs:[...context.inputs,[coordinate,input.digest] as const]};
 readingIdentityBytes(result);
 return result;
}
