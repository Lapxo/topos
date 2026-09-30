// A line read and written back to the same bytes, then an alphabet read and written back.
import { alphabet, canonical, parse } from '@lapxo/topos/wire';

const line = 'bound-lock/1 about="a \\"quoted\\" word,\\nthen a second line" at=witness:x by=owner form=interval measure=len role=reads scope=acme/users/email value=0..320';
const read = parse(line);
if (read.kind !== 'fact') throw new Error(read.why);
const again = canonical(read.value.fields);
console.log(read.value.fields['about']);
console.log(again);
console.log('same bytes', again === line);
const words = 'not:draft|either\\|or';
console.log(JSON.stringify(alphabet(words)));
console.log(alphabet(alphabet(words)), 'same bytes', alphabet(alphabet(words)) === words);
