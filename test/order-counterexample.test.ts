import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {intervals} from '@lapxo/obligations';
import {cell,sign,join,parts,type World} from '@lapxo/obligations/views/field';
import {parse} from '../src/core.ts';
import {standingBytes,semanticStandingBytes} from '../src/topos/standing.ts';
import {intervalForm} from '../src/forms/interval.ts';

test('equal sorted identity can hide different ceilings; effective identity cannot',()=>{
  const sample=JSON.parse(readFileSync(new URL('../samples/readings/order.no.json',import.meta.url),'utf8'));
  const lattice=intervals(0,100),codec=intervalForm;
  const digest=(bytes:string)=>createHash('sha256').update(bytes).digest('hex');
  const results=sample.cases.map((example:{lines:string[];signed:{lo:number;hi:number}})=>{
    let world:World<{lo:number;hi:number}>=new Map([['B',cell('B')]]);
    for(const line of example.lines){
      const parsed=parse(line);assert.equal(parsed.kind,'fact');if(parsed.kind!=='fact')throw Error('invalid sample');
      const f=parsed.value.fields,span=codec.parse({lo:0,hi:100},f.value!);
      if(f.widens)world=new Map([...world,['B',join(lattice,world.get('B')!,span,f.widens,Number(f.epoch))]]);
      else world=sign(lattice,world,'B',span,{id:f.id,at:Number(f.epoch)});
    }
    assert.deepEqual(parts(lattice,world.get('B')!,world).signed,example.signed);
    return {naive:digest(standingBytes(example.lines)),effective:digest(semanticStandingBytes(example.lines))};
  });
  assert.equal(results[0].naive,results[1].naive);
  assert.notEqual(results[0].effective,results[1].effective);
});
