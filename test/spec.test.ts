import { createHash } from 'node:crypto';
import { canonical, parse } from '@lapxo/topos/wire';
import { load } from './harness.ts';

type Spec = { readonly name: string; readonly input: string; readonly expected: Readonly<Record<string, unknown>> };

for (const corpus of ['bound-lock-1', 'fold']) {
  test(`spec-lines-read-back — every line of the ${corpus} corpus parses as the spec reads it, and a fact's canonical line reads back to itself`, () => {
    for (const one of (load(`spec/${corpus}`)['cases'] ?? []) as readonly Spec[]) {
      const got = parse(one.input);
      if (got.kind !== 'fact') {
        compare({ kind: got.kind, why: got.why ?? '' }, one.expected, one.name);
        continue;
      }
      const fields = { ...got.value.fields };
      const line = canonical(fields);
      const back = parse(line);
      const trips = back.kind === 'fact' && canonical({ ...back.value.fields }) === line;
      compare({ kind: got.kind, canonical: line, fields, sha256: createHash('sha256').update(line, 'utf8').digest('hex'), roundTrip: trips }, one.expected, one.name);
    }
  });
}
