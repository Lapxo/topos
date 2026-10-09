import {canonical,parse} from '../wire/line.ts';

export interface Snapshot {
  readonly source:string;
  readonly content:string;
  readonly observed:string;
  readonly clock:string;
  /** A declared freshness policy identity, never an invented duration. */
  readonly freshness?:string;
  readonly implementation:string;
}
const requireSnapshot=(snapshot:Snapshot):void=>{
  for(const field of ['source','content','observed','clock','implementation'] as const)
    if(!snapshot[field])throw Error(`REFUSE·snapshot missing ${field}`);
  if(snapshot.freshness!==undefined&&!snapshot.freshness)throw Error('REFUSE·snapshot empty freshness declaration');
};

/** A snapshot commitment is not a standing pin, public key or independent
 * origin. The caller supplies the admitted digest algorithm. This pure
 * projection neither reads bytes nor creates an observation or receipt. */
export function snapshotIdentity(snapshot:Snapshot,digest:(bytes:string)=>string):string {
  requireSnapshot(snapshot);
  return digest(canonical({scope:snapshot.source,role:'writes',form:'alphabet',measure:'snapshot',
    value:snapshot.content,at:snapshot.observed,clock:snapshot.clock,
    ...(snapshot.freshness===undefined?{}:{freshness:snapshot.freshness}),implementation:snapshot.implementation})+'\n');
}

export interface ResponseContext {
  readonly principal:string;
  readonly authorization:string;
  readonly implementation:string;
  readonly snapshot:string;
  readonly request:string;
}
export function responseIdentity(snapshot:Snapshot,context:ResponseContext,digest:(bytes:string)=>string):string {
  if(context.snapshot!==snapshotIdentity(snapshot,digest))throw Error('REFUSE·snapshot response names another snapshot');
  for(const name of ['principal','authorization','implementation','snapshot','request'] as const)
    if(!context[name])throw Error(`REFUSE·snapshot missing response ${name}`);
  if(context.implementation!==snapshot.implementation)throw Error('REFUSE·snapshot response names another implementation');
  return digest(canonical({principal:context.principal,authorization:context.authorization,
    implementation:context.implementation,snapshot:context.snapshot,request:context.request})+'\n');
}
/** Inspection and permission to assert a retained response today are separate
 * folded permissions. Unknown freshness cannot certify current reuse. */
export function snapshotAccess(snapshot:Snapshot,kept:ResponseContext,current:ResponseContext,
  permission:{readonly inspect:boolean;readonly reuse:boolean;readonly freshness:'fresh'|'stale'|'unknown'},
  digest:(bytes:string)=>string):{
    readonly inspect:boolean;readonly reuse:boolean;
  } {
  requireSnapshot(snapshot);
  for(const context of [kept,current])for(const name of ['principal','authorization','implementation','snapshot','request'] as const)
    if(!context[name])throw Error(`REFUSE·snapshot missing response ${name}`);
  return {inspect:permission.inspect,reuse:permission.reuse&&snapshot.freshness!==undefined&&permission.freshness==='fresh'
    &&kept.principal===current.principal&&kept.authorization===current.authorization
    &&kept.implementation===current.implementation&&snapshot.implementation===current.implementation
    &&kept.snapshot===current.snapshot&&current.snapshot===snapshotIdentity(snapshot,digest)&&kept.request===current.request};
}

export function originRegion(lines:readonly string[],coordinate:string):{readonly source:string}|undefined {
  const rows=lines.flatMap(line=>{const p=parse(line);return p.kind==='fact'?[p.value.fields]:[];})
    .filter(fields=>fields.scope===coordinate&&fields.role==='writes'&&fields.value!=='withdraw'
      &&['origin','coordinates','leaves'].includes(fields.measure??''));
  const origins=rows.filter(fields=>fields.measure==='origin');
  if(!origins.length)return undefined;
  const sources=new Set(origins.map(fields=>fields.value));
  if(rows.length!==origins.length||sources.size!==1||!origins[0]?.value)
    throw Error(`REFUSE·region ${coordinate} conflicting origin projection`);
  return {source:origins[0].value};
}
