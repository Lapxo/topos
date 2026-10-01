// topos-measure built in front of you from its own bytes: its lock, its regions and its vector, every case asked through the one contract, then the line a place adopts it with.
import { intervals } from '@lapxo/obligations';
import type { Interval } from '@lapxo/obligations';
import { cell, encounter, observe, state } from '@lapxo/obligations/views/field';
import { declarationOf, found, lang, listed, of, shell } from '@lapxo/topos/capsule';
import type { Asked, Handed } from '@lapxo/topos/capsule';
import { answer } from '@lapxo/topos/contract';
import { PROTOCOL, canonical, fromLine, steps } from '@lapxo/topos/wire';

const capsule = [
  `bound-lock/1 about="the domain this capsule serves: what several origins measured, each quantity read as one cell" at=policy:topos/capsule by=target form=alphabet measure=id role=writes scope=capsule/domain value=measurements`,
  `bound-lock/1 about="the runtime a host starts this capsule with, whose entry, regions and effects are the runtime's own lines" at=policy:topos/capsule by=target form=alphabet measure=id role=writes scope=capsule/runtime value=node`,
  `bound-lock/1 about="where this capsule's world keeps its values: the place's own files" at=policy:topos/capsule by=target form=alphabet measure=id role=writes scope=capsule/holds value=./`,
  `bound-lock/1 about="the held region" at=policy:topos/capsule by=target form=alphabet measure=reads role=render scope=region/held value=lang|form/prose/**|form/template/**|prose/*/measure/*|measure/**`,
  `bound-lock/1 about="the readings region" at=policy:topos/capsule by=target form=alphabet measure=reads role=render scope=region/readings value=lang|form/prose/**|prose/*/measure/*|measure/**`,
  `bound-lock/1 about="what this capsule reaches beyond the lines it is handed" at=policy:topos/capsule by=target form=alphabet measure=effects role=writes scope=capsule/effects value=none`,
  `bound-lock/1 about="the topos release this capsule is packed against, named by its digest" at=policy:topos/capsule by=target form=alphabet measure=digest role=writes scope=capsule/topos value=sha256:a87ffd5ab77a99b9e40cc720acfdf0ee7f36d156c72085a20db1232b0653c1dd`,
];

const prose = (asked: Asked, key: string): string | undefined => ((line) => (line === undefined ? undefined : of(line, 'about')))(found(asked, `prose/${lang(asked)}/${key}`));

const SPANS = intervals(-Infinity, Infinity);
const span = (line: Handed): Interval | undefined => ((got) => (got.kind === 'fact' && got.value.bound.kind === 'interval' && got.value.bound.lo !== null && got.value.bound.hi !== null
  ? { lo: got.value.bound.lo, hi: got.value.bound.hi } : undefined))(fromLine(canonical(line), null));
const say = (asked: Asked, key: string, fields: Readonly<Record<string, string | number>>): string => listed(asked, `form/template/${key}`).reduce((text, field) => text.split(`{${field}}`).join(String(fields[field] ?? '')), prose(asked, key) ?? '');
const held = (asked: Asked): readonly string[] => {
  const read = asked.lines.filter((line) => steps(of(line, 'scope')).length === 3);
  const numbers = listed(asked, `form/prose/${lang(asked)}/numbers`);
  return [...new Set(read.map((line) => steps(of(line, 'scope'))[1] ?? ''))].map((quantity) => {
    const mine = read.filter((line) => steps(of(line, 'scope'))[1] === quantity);
    const met = mine.reduce((at, line) => ((one) => (one === undefined ? at : observe(at, { origin: steps(of(line, 'scope'))[2] ?? '', span: one })))(span(line)), cell<Interval>(quantity));
    const { origins, held: meet } = encounter(SPANS, met);
    return say(asked, `measure/${state(SPANS, met)}`, { quantity, origins: numbers[origins] ?? String(origins), lo: meet.lo, hi: meet.hi, unit: of(mine[0], 'measure') });
  });
};

const readings = (asked: Asked): readonly string[] => {
  const read = asked.lines.filter((line) => steps(of(line, 'scope')).length === 3);
  return read.length ? [`## ${prose(asked, 'measure/readings') ?? ''}`, '', prose(asked, 'measure/table') ?? '', '|---|---|---|',
    ...read.map((line) => ((at) => `| ${at[1] ?? ''} | ${at[2] ?? ''} | ${of(line, 'value')} ${of(line, 'measure')} |`)(steps(of(line, 'scope'))))] : [];
};

const render = shell({
  held: { reads: ['lang', 'form/prose/**', 'form/template/**', 'prose/*/measure/*', 'measure/**'], region: held },
  readings: { reads: ['lang', 'form/prose/**', 'prose/*/measure/*', 'measure/**'], region: readings },
});

const said = [
  `bound-lock/1 about=Readings at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/readings value=lock`,
  `bound-lock/1 about="| quantity | origin | reading |" at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/table value=lock`,
  `bound-lock/1 about="The {origins} origins that measured {quantity} meet: every one of their readings holds {lo}..{hi} {unit}." at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/FREE value=lock`,
  `bound-lock/1 about="The {origins} origins that measured {quantity} do not meet: no value in {unit} is held by all of their readings, and no average of them closes that." at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/CONFLICT value=lock`,
  `bound-lock/1 about="Only {origins} origin measured {quantity}: its reading holds nothing yet, until a second origin's reading meets it." at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/REQUIRED value=lock`,
  `bound-lock/1 about="The {origins} origins that measured {quantity} meet, but outside what the bounds on it allow." at=policy:topos-measure/example by=target form=alphabet measure=text role=writes scope=prose/en/measure/FORBIDDEN value=lock`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=form/template/measure/FREE value=origins|quantity|lo|hi|unit`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=form/template/measure/CONFLICT value=origins|quantity|unit`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=form/template/measure/REQUIRED value=origins|quantity`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=form/template/measure/FORBIDDEN value=origins|quantity`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=form/prose/en/numbers value=zero|one|two|three|four|five|six|seven|eight|nine|ten`,
  `bound-lock/1 at=policy:topos-measure/example by=target form=alphabet measure=id role=writes scope=lang value=en`,
];
const met = [
  { origin: 'a', span: { lo: 19.8, hi: 20.2 } },
  { origin: 'b', span: { lo: 19.9, hi: 20.3 } },
  { origin: 'c', span: { lo: 19.7, hi: 20.1 } },
].map(({ origin, span: { lo, hi } }) => canonical({ at: 'policy:topos-measure/example', by: 'target', form: 'interval', measure: 'celsius', role: 'writes', scope: `measure/room/${origin}`, value: `${lo}..${hi}` }));
const apart = `bound-lock/1 at=policy:topos-measure/example by=target form=interval measure=celsius role=writes scope=measure/room/d value=24..24.4`;
const worlds: Readonly<Record<string, readonly string[]>> = { 'root:topos-measure': [...said, ...met, apart], 'agreed:topos-measure': [...said, ...met], 'alone:topos-measure': [...said, ...met.slice(0, 1)] };
const cases = [
  { world: 'root:topos-measure', region: 'held', expected: ['The four origins that measured room do not meet: no value in celsius is held by all of their readings, and no average of them closes that.'] },
  { world: 'agreed:topos-measure', region: 'held', expected: ['The three origins that measured room meet: every one of their readings holds 19.9..20.1 celsius.'] },
  { world: 'alone:topos-measure', region: 'held', expected: [`Only one origin measured room: its reading holds nothing yet, until a second origin's reading meets it.`] },
  { world: 'root:topos-measure', region: 'readings', expected: ['## Readings', '', '| quantity | origin | reading |', '|---|---|---|', '| room | a | 19.8..20.2 celsius |', '| room | b | 19.9..20.3 celsius |', '| room | c | 19.7..20.1 celsius |', '| room | d | 24..24.4 celsius |'] },
];

const declared = declarationOf(capsule);
const ask = (world: string, region: string, reads: readonly string[]) =>
  answer({ render }, { protocol: PROTOCOL, verb: 'render', rootScope: '', files: [], lines: worlds[world] ?? [], region, at: 3, shape: 'README.md', name: 'topos-measure', reads }, '');
for (const line of capsule) console.log(line);
let [holds, shorts, refused] = [0, 0, 0];
for (const { world, region, expected } of cases) {
  const reads = declared.regions[region] ?? [];
  const got = ask(world, region, reads);
  const same = JSON.stringify(got) === JSON.stringify({ protocol: PROTOCOL, kind: 'fact', lines: expected });
  [holds, shorts] = [holds + (same ? 1 : 0), shorts + reads.length];
  refused += reads.filter((one) => ask(world, region, reads.filter((other) => other !== one)).kind === 'refuse').length;
  console.log(`${same ? 'HELD   ' : 'DIFFERS'}  ${world} · ${region}`);
  for (const line of got.lines ?? [got.why ?? '']) console.log(line ? `         ${line}` : '');
}
console.log(`HELD ${holds}/${cases.length}`);
console.log(`REFUSED ${refused}/${shorts}: each case asked again with one read its region declares taken away`);
console.log(canonical({ at: 'policy:acme/capsules', by: 'target', form: 'alphabet', measure: 'id', role: 'writes', scope: 'uses/topos-measure', value: 'sha256:3252cbb877d9ca0c9ea990828c1490999de3d4853990d53d6bbd31861e6bb780' }));
