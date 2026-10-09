import {canonical,parse} from '../wire/line.ts';

/** semantic-standing@1 encodes an already folded place in effective order.
 * It does not fold, authenticate, sort, execute or discover a place. The
 * historical Topos set encoding remains a different, unchanged contract. */
export function semanticStandingBytes(live:readonly string[]):string {
  if(!live.length)throw Error('REFUSE·projection empty standing');
  const lines=live.map(line=>{
    const got=parse(line,{preserveKeys:true});
    if(got.kind!=='fact')throw Error(`REFUSE·projection ${got.why}`);
    if(got.value.fields.value==='withdraw')throw Error('REFUSE·projection history is not standing');
    const {sig,by,epoch,expires,repo,shape,...fields}=got.value.fields;
    if(fields.needs?.split('|').some(name=>name.startsWith('/')||name.split('/').includes('..')))
      throw Error('REFUSE·projection host path is not a semantic coordinate');
    return canonical(fields,got.value.version);
  });
  // Re-delivery contributes no inscription. Preserve the first effective
  // occurrence; sorting would erase the sign/join counterexample.
  return [...new Set(lines)].join('\n')+'\n';
}

export function readSemanticStanding(bytes:string):readonly string[] {
  const lines=bytes.endsWith('\n')?bytes.slice(0,-1).split('\n'):[];
  if(!lines.length||semanticStandingBytes(lines)!==bytes)
    throw Error('REFUSE·projection bytes are not canonical semantic standing');
  return lines;
}
