import {pathToFileURL} from 'node:url';
import type {ObjectContext,SelectedObjectForm} from '../wire/object-context.ts';
import type {ObjectRecord} from '../wire/object-record.ts';
import type {StandingTopos} from '../topos/standing.ts';
type Fields=Readonly<Record<string,string>>;
interface Services{admit:(fields:Fields)=>boolean;emit:(text:string)=>void;topos?:(digest:string)=>StandingTopos;module?:(digest:string)=>string}
interface Provider{resolve:(cell:ObjectRecord)=>SelectedObjectForm;origin:ObjectContext['origin'];witness:ObjectContext['witness']}
/** Host selection is explicit signed uses data; resource validation precedes module import. */
export async function objectProvider(objects:readonly ObjectRecord[],configuration:readonly Fields[],services:Services):Promise<ObjectContext>{
 const providers=new Map<string,Provider>(),cells=new Map(objects.filter(r=>r.record==='cell').map(r=>[r.fields.scope!,r]));
 for(const pin of new Set([...cells.values()].map(r=>r.fields.topos!))){
  const bindings=configuration.filter(f=>f.scope?.startsWith('uses/')&&f.value===pin&&services.admit(f));
  if(bindings.length!==1)throw Error(`REFUSE·pin object provider ${pin} needs one authenticated uses binding`);
  {
   if(!services.topos||!services.module)throw Error('REFUSE·pin standing provider has no declared host adapter');
   const selected=services.topos(pin);
   const selectors=selected.parts.filter(p=>p.scope==='wire/topos/context-view');
   if(selectors.length!==1)throw Error('REFUSE·codec topos needs one declared context view');
   const offers=selected.parts.filter(p=>p.kind==='check'&&p.view===selectors[0]!.value);
   if(offers.length!==1)throw Error('REFUSE·codec topos needs one context offer');
   const offer=offers[0]!;
   if(offer.measure!=='digest'||!offer.value||!(offer.restsOn??'').split('|').includes(offer.value))throw Error('REFUSE·pin context offer requires its artifact in restsOn');
   const module=await import(pathToFileURL(services.module(offer.value)).href) as {context?: (args:{digest:string;records:readonly Fields[];admit:Services['admit'];emit:Services['emit']})=>Provider};
   if(typeof module.context!=='function')throw Error('REFUSE·codec offered artifact has no context export');
   const provider=module.context({digest:pin,records:configuration,admit:services.admit,emit:services.emit});
   if(!provider||typeof provider.resolve!=='function'||typeof provider.origin!=='function'||typeof provider.witness!=='function')throw Error('REFUSE·codec offered context lacks resolve/origin/witness');
   providers.set(pin,provider);
  }

 }
 const at=(scope:string)=>{const c=cells.get(scope);if(!c)throw Error(`REFUSE·context missing cell ${scope}`);return providers.get(c.fields.topos!)!;};
 return {admit:r=>services.admit(r.fields),resolve:c=>at(c.fields.scope!).resolve(c),origin:(id,by,scope)=>at(scope).origin(id,by,scope),witness:(id,by,scope)=>at(scope).witness(id,by,scope)};
}
