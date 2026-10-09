import {byBytes} from '../wire/line.ts';

export interface ReleaseLink {readonly digest:string;readonly predecessor:string}
/** A URL is a location, not an ordering relation. Only authenticated direct
 * successors under the supplied lineage contract can propose a follow/bump. */
export function releaseSuccessors(current:string,candidates:readonly ReleaseLink[],
  verifies:(release:ReleaseLink)=>boolean):readonly ReleaseLink[] {
  if(!current)throw Error('REFUSE·lineage missing current release');
  const links=new Map<string,ReleaseLink>();
  for(const release of candidates){
    if(!release.digest||!release.predecessor||!verifies(release))throw Error('REFUSE·lineage unauthenticated release');
    const prior=links.get(release.digest);
    if(prior&&prior.predecessor!==release.predecessor)throw Error(`REFUSE·lineage ${release.digest} conflicting predecessor`);
    links.set(release.digest,release);
  }
  for(const digest of links.keys()){
    const seen=new Set<string>();let at:string|undefined=digest;
    while(at&&links.has(at)){
      if(seen.has(at))throw Error(`REFUSE·lineage ${digest} predecessor cycle`);
      seen.add(at);at=links.get(at)!.predecessor;
    }
  }
  return [...links.values()].filter(link=>link.predecessor===current&&link.digest!==current)
    .sort((a,b)=>byBytes(a.digest,b.digest));
}

export interface WeightEntry {readonly digest:string;readonly bytes:number|null;readonly named:boolean}
/** Verified storage bytes, not information freedom or a response valuation.
 * Scan completeness is explicit; an omitted scan never reads as zero. */
export function weightOf(entries:readonly WeightEntry[],complete:boolean):{
  readonly unit:'bytes';readonly known:number|null;readonly total:number|null;readonly unreferenced:number|null;
} {
  const held=new Map<string,WeightEntry>();
  for(const entry of entries){
    if(!entry.digest||(entry.bytes!==null&&(!Number.isSafeInteger(entry.bytes)||entry.bytes<0)))
      throw Error('REFUSE·weight invalid verified byte reading');
    const prior=held.get(entry.digest);
    if(prior&&prior.bytes!==entry.bytes)throw Error(`REFUSE·weight ${entry.digest} conflicting byte reading`);
    held.set(entry.digest,{...entry,named:entry.named||(prior?.named??false)});
  }
  const values=[...held.values()],sum=values.reduce((sum,entry)=>sum+(entry.bytes??0),0);
  if(!Number.isSafeInteger(sum))throw Error('REFUSE·weight byte sum exceeds exact range');
  const closed=complete&&values.every(entry=>entry.bytes!==null);
  const known=closed||values.some(entry=>entry.bytes!==null)?sum:null;
  return {unit:'bytes',known,total:closed?sum:null,
    unreferenced:closed?values.filter(entry=>!entry.named).reduce((sum,entry)=>sum+entry.bytes!,0):null};
}

/** Absence in an authenticated, complete window implies no correctness or
 * object state. A missing window reading is unknown, never green or zero. */
export function vacuityOf(now:number,window:number,observedEpochs:readonly number[],complete:boolean):{
  readonly unit:'epochs';readonly from:number;readonly through:number;readonly reading:'observed'|'unobserved'|'unknown';
} {
  if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(window)||window<=0
    ||observedEpochs.some(epoch=>!Number.isSafeInteger(epoch)||epoch<0||epoch>now))throw Error('REFUSE·vacuous invalid declared epoch window');
  const from=Math.max(0,now-window+1);
  return {unit:'epochs',from,through:now,reading:observedEpochs.some(epoch=>epoch>=from)?'observed':complete?'unobserved':'unknown'};
}

/** Keep/follow select existing coordinates only. They do not fetch, execute,
 * bless a release, delete history or grant coverage. Materialization is host
 * work requested later by an admitted view. */
export function inspectionSelection(selection:readonly string[],admitted:readonly string[]):readonly string[] {
  const known=new Set(admitted);
  for(const coordinate of selection)if(!coordinate||!known.has(coordinate))throw Error(`REFUSE·inspection unknown coordinate ${coordinate||'(absent)'}`);
  return [...new Set(selection)].sort(byBytes);
}
