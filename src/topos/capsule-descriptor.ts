import {canonical,parse} from '../wire/line.ts';
import {declarationOf} from '../capsule/declaration.ts';
import {standingBytes} from './standing.ts';
import type {StandingTopos} from './standing.ts';

/** Declared region metadata permits discovery without fetching or executing an artifact. */
export function capsuleDescriptor(topos:StandingTopos,offer:string) {
 const prefix=`${offer}/declaration/`;
 const rows=topos.parts.filter(part=>part.scope?.startsWith(prefix));
 if(!rows.length)return undefined;
 const protocol=topos.parts.filter(part=>['wire/capsule-declaration','audit/wire/capsule-declaration'].includes(part.scope??''));
 if(!protocol.length||protocol.some(part=>part.value!=='standing-regions@1'))throw Error(`REFUSE·wire ${offer} needs standing-regions@1`);
 const lines=rows.map(part=>{
  const scope=part.scope!.slice(prefix.length);
  if(!scope.startsWith('region/')||!['reads','writes'].includes(part.measure??''))throw Error(`REFUSE·topos ${part.scope} is not declared region metadata`);
  return canonical({...part,scope});
 });
 return {lines,declaration:declarationOf(lines)};
}

/** A descriptor cannot conceal a different artifact contract, including extra regions. */
export function assertCapsuleDescriptor(expected:readonly string[],actual:readonly string[]):void {
 const regions=actual.filter(line=>{const got=parse(line);return got.kind==='fact'&&got.value.fields.scope?.startsWith('region/')&&['reads','writes'].includes(got.value.fields.measure??'');});
 if(!regions.length||standingBytes(expected)!==standingBytes(regions))throw Error('REFUSE·capsule artifact region contract differs from selected standing');
}
