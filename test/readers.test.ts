import { costOf } from '@lapxo/topos/readers';
import { answer, listen, observed } from '@lapxo/topos/contract';
import { declarationOf, readers } from '@lapxo/topos/capsule';
import { PROTOCOL } from '@lapxo/topos/wire';
import { load, sample } from './harness.ts';

type Cost = { readonly name: string; readonly observed: readonly (readonly [number, number])[]; readonly cost?: readonly [number, number] };
type Seen = {
  readonly name?: string; readonly files?: readonly { readonly place: string; readonly text: string }[]; readonly kind?: string; readonly claims?: readonly string[];
  readonly listening?: boolean; readonly through?: string; readonly sample?: Readonly<Record<string, unknown>>; readonly at?: string; readonly read?: readonly string[]; readonly notes?: readonly string[];
  readonly region?: string; readonly input?: string; readonly expected?: { readonly kind: string; readonly why: string };
};
const echo = { observe: (bytes: Uint8Array) => [new TextDecoder().decode(bytes)] };
const shelled = readers({ echo: { reads: ['*'], observe: (bytes: Uint8Array) => echo.observe(bytes) }, text: { reads: ['*.txt'], observe: (bytes: Uint8Array) => echo.observe(bytes) } });
const asked = (files: Seen['files'], through?: string, region = 'echo') => answer(through === 'readers' ? shelled : echo, { protocol: PROTOCOL, verb: 'read', rootScope: 'p.txt', region, files: files ?? [] }, '');

test('cost-is-a-fold — the spans observed runs took join to a region\'s cost, and a cost only declared has none', () => {
  for (const one of (load('readers/cost')['cases'] ?? []) as readonly Cost[]) {
    compare(costOf(one.observed), one.cost === undefined ? {} : { cost: one.cost }, one.name);
  }
});

test('observe-is-an-interface — a reader observes the file the contract hands it or is refused, and a read is noted only while a runner listens', () => {
  for (const one of (load('observe')['cases'] ?? []) as readonly Seen[]) {
    if (one.files) {
      const got = asked(one.files, one.through, one.region);
      compare(one.expected ? { kind: got.kind, why: got.kind === 'fact' ? '' : got.why } : got.kind === 'fact' ? { kind: got.kind, claims: got.claims } : { kind: got.kind }, one.expected ?? (one.claims ? { kind: one.kind, claims: one.claims } : { kind: one.kind }), one.name);
      continue;
    }
    const notes: string[] = [];
    const was = listen(one.listening ? (at) => notes.push(at) : undefined);
    const held = observed(one.sample ?? {}, one.at ?? '') as { readonly cases?: readonly Readonly<Record<string, unknown>>[] };
    for (const field of one.read ?? []) void held.cases?.[0]?.[field];
    listen(was);
    compare(notes, one.notes, one.name);
  }
  const falsifier = sample('no', 'reader-read-an-empty-file') as Seen;
  compare(asked(falsifier.files).kind, falsifier.kind, falsifier);
});

type Declared = { readonly name: string; readonly world: string; readonly expected: Readonly<Record<string, unknown>> };

test('capsule-lines-are-the-declaration — a capsule\'s runtime, where its world holds its values and the releases it pins are its own lines', () => {
  const vector = load('declaration') as { readonly worlds?: Readonly<Record<string, { readonly lines: readonly string[] }>>; readonly cases?: readonly Declared[] };
  for (const one of vector.cases ?? []) {
    const d = declarationOf(vector.worlds?.[one.world]?.lines ?? []);
    compare({ domain: d.domain, ...(d.runtime === undefined ? {} : { runtime: d.runtime }), ...(d.holds === undefined ? {} : { holds: d.holds }), pins: d.pins, effects: d.effects, regions: Object.keys(d.regions).sort() }, one.expected, one.name);
  }
});
