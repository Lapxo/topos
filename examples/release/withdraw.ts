// A claim withdrawn by its at stays withdrawn at that at, and the same claim at a fresh at stands again with its exact value, every line kept.
import { parse, wireAt } from '@lapxo/topos/wire';

const history = [
  'bound-lock/1 at=policy:acme/forms by=owner epoch=1 form=alphabet measure=id role=writes scope=wire/forms value=alphabet|interval',
  'bound-lock/1 at=policy:acme/forms by=owner epoch=2 form=alphabet measure=id role=writes scope=wire/forms value=withdraw',
  'bound-lock/1 at=policy:acme/forms by=owner epoch=3 form=alphabet measure=id role=writes scope=wire/forms value=alphabet|interval',
  'bound-lock/1 at=witness:a-form-list-signed-again by=owner epoch=4 form=alphabet measure=id role=writes scope=wire/forms value=alphabet|interval',
];
const lines = history.flatMap((text) => ((read) => (read.kind === 'fact' ? [read.value.fields] : []))(parse(text)));
const named = (epoch: number): string => ((wire) => (wire === null ? 'nothing' : [...wire.forms].join('|')))(wireAt(lines, epoch));
const said = lines.map((line) => `epoch ${line['epoch']}  ${line['value']} at ${line['at']}`);
const wide = Math.max(...said.map((one) => one.length));
lines.forEach((line, i) => console.log(`${said[i]?.padEnd(wide)}  the wire names ${named(Number(line['epoch']))}`));
const [first, last] = [Number(lines[0]?.['epoch']), Number(lines[lines.length - 1]?.['epoch'])];
console.log(`restored  ${named(first)} at epoch ${first}, ${named(last)} at epoch ${last}: ${named(first) === named(last) ? 'the same value' : 'another value'}`);
console.log(`history   ${lines.length} of ${history.length} lines read, none removed: the wire at each epoch reads every one signed by then`);
console.log('why       a withdraw takes back the line its at names, and that at stays taken on its scope: a re-sign needs a new one');
