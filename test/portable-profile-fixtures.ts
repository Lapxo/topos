import {createHash} from 'node:crypto';
import {canonical} from '../src/wire/line.ts';
import {encodeSourceCard} from '../src/contract/source-card.ts';
import {encodeProfileComposition} from '../src/contract/profile-composition.ts';
export const digest=(s:string)=>'sha256:'+createHash('sha256').update(s).digest('hex');
export const budget={bytes:65536,items:128};
export function portableFixture(place='catalog/items'){
 const pack={origin:digest(place),declarations:[canonical({scope:place+'/name',role:'writes',form:'alphabet',measure:'text',value:'public-birth'})]};
 const card={source:place,publisher:'publisher',catalog:digest('forms'),form:'budget',params:'{"hi":10,"lo":0}',resolution:'0..10',authority:'consumer',cost:'0..10','cost-unit':'calls','cost-limit':'10',needs:'none'};
 const exhaustion={card:digest(encodeSourceCard(card)+'\n'),source:place,unit:'calls',frame:{clock:'fixture-clock',unit:'ticks',from:0,through:100},exhaustedAt:10,knownSince:11,evidence:digest('observation:'+place),events:[{id:'call-1',evidence:digest('call:'+place)}],recovery:{kind:'declared' as const,at:20,evidence:digest('recovery:'+place)}};
 const contract=digest('receiver-budget-form/v1');const parent={name:place+'/profile',parents:[],fields:[{coordinate:place+'/calls',contract,value:'0..10'}],pins:[{category:'forms/budget',class:'form',algorithm:'sha256' as const,digest:digest('budget-module')}],witnesses:[]};
 const parentBytes=encodeProfileComposition(parent,budget);const profile={...parent,parents:[digest(parentBytes+'\n')],fields:[{coordinate:place+'/calls',contract,value:'0..5'}],pins:[]};
 return {place,pack,card,exhaustion,parent,profile,profiles:[[digest(parentBytes+'\n'),parentBytes]] as [string,string][],expected:{source:place,clock:'fixture-clock',unit:'ticks'}};
}
