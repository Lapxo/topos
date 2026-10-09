import {byBytes,canonical,parse} from '../wire/line.ts';
import {matches} from '../wire/classes.ts';
export {semanticStandingBytes,readSemanticStanding} from './semantic-projection.ts';
export {shadowProfile,shadowAt} from './shadow.ts';
export type {ShadowProfile} from './shadow.ts';

export interface StandingTopos {
  readonly lines: readonly string[];
  readonly parts: readonly Readonly<Record<string,string>>[];
  readonly dependencies: readonly string[];
}

/** Identity encoding of an already admitted, folded standing. This is not admission or a fold. */
export function standingBytes(lines: readonly string[]): string {
  if (!lines.length) throw Error('REFUSE·topos empty standing');
  const canonicalLines=lines.map(line=>{
    const got=parse(line,{preserveKeys:true});
    if(got.kind!=='fact') throw Error(`REFUSE·topos ${got.why}`);
    if(got.value.fields.value==='withdraw') throw Error('REFUSE·topos history is not standing');
    const {sig,by,epoch,expires,repo,shape,...live}=got.value.fields;
    if(live.needs?.split('|').some(name=>name.startsWith('/')||name.split('/').includes('..')))
      throw Error('REFUSE·topos host path is not a standing coordinate');
    return canonical(live,got.value.version);
  });
  return [...new Set(canonicalLines)].sort(byBytes).join('\n')+'\n';
}

/** Strict decoding; no archive sniffing, defaults, history replay, runtime or filesystem coordinates. */
export function readStanding(text: string): StandingTopos {
  const lines=text.endsWith('\n')?text.slice(0,-1).split('\n'):[];
  if(!lines.length||standingBytes(lines)!==text) throw Error('REFUSE·topos bytes are not canonical standing');
  const parts=lines.map(line=>{
    const got=parse(line,{preserveKeys:true});
    if(got.kind!=='fact') throw Error(`REFUSE·topos ${got.why}`);
    return got.value.fields;
  });
  const dependencies=[...new Set(parts.flatMap(part=>(part.restsOn??'').split('|').filter(Boolean)))].sort(byBytes);
  for(const part of parts)if(part.kind&&part.measure==='digest'&&!(part.restsOn??'').split('|').includes(part.value??''))
    throw Error(`REFUSE·topos ${part.scope} missing required restsOn for digest offer`);
  return {lines,parts,dependencies};
}

/** The host supplies its admitted fold; region declarations select the live parts, without another algebra. */
export function toposStanding(live:readonly string[]):string|undefined {
  const parsed=live.map(line=>{const got=parse(line);if(got.kind!=='fact')throw Error(`REFUSE·topos ${got.why}`);return {line,fields:got.value.fields};});
  const regions=parsed.filter(({fields})=>fields.scope?.startsWith('region/')&&fields.measure==='reads');
  if(!regions.length)return undefined;
  const masks=regions.flatMap(({fields})=>(fields.value??'').split('|').filter(Boolean));
  if(!masks.length)throw Error('REFUSE·topos no declared regions');
  const selected=parsed.filter(one=>regions.includes(one)||masks.some(mask=>matches(mask,one.fields.scope??'')));
  const bytes=standingBytes(selected.map(one=>one.line));readStanding(bytes);return bytes;
}

/** An offered executable is one part of a topos, not its identity. Its artifact must be in the closure. */
export function capsuleOffers(topos: StandingTopos): readonly Readonly<Record<string,string>>[] {
  return topos.parts.filter(part=>part.kind==='capsule').map(part=>{
    if(part.measure!=='digest'||!part.value||!(part.restsOn??'').split('|').includes(part.value))
      throw Error(`REFUSE·topos ${part.scope??''} capsule needs measure=digest and an explicit artifact in restsOn`);
    return part;
  });
}

export {providerInputs,providerFields,providerInputRegions} from './provider-inputs.ts';
export type {ProviderInputs} from './provider-inputs.ts';
export {capsuleDescriptor,assertCapsuleDescriptor} from './capsule-descriptor.ts';
