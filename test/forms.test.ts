import { alphabetOfForm, budgetForm, distributionForm, intervalForm, ladderOfForm, latticeOfForm, phaseForm, rankForm, stretchForm } from '@lapxo/topos/forms';
import type { WireForm } from '@lapxo/topos/forms';
import { fromLine, parse, wireAt } from '@lapxo/topos/wire';
import { load } from './harness.ts';

type Case = { readonly form: string; readonly params: unknown; readonly seed: number; readonly n: number };
const offered = [intervalForm, alphabetOfForm, ladderOfForm, latticeOfForm, budgetForm, rankForm, phaseForm, stretchForm, distributionForm] as readonly WireForm[];

test('forms-carry-generators — a point each form draws, written and read back, writes the same text', () => {
  for (const one of (load('forms')['cases'] ?? []) as readonly Case[]) {
    const form = offered.find((each) => each.id === one.form);
    const written = form === undefined ? [] : form.points(one.params, one.seed, one.n).map((point) => form.emit(one.params, point));
    compare(form === undefined ? [one.form] : written.map((text) => form.emit(one.params, form.parse(one.params, text))), written, one.form);
  }
});

type Registered = { readonly name: string; readonly world: string; readonly line?: string; readonly kind?: string; readonly input?: string; readonly expected?: { readonly kind: string; readonly why: string } };

test('forms-are-locks-loaded-by-name — a form and a field\'s alphabet are read by the name a lock line gives them, and a form no line names abstains', () => {
  const vector = load('forms-registry') as { readonly worlds?: Readonly<Record<string, readonly string[]>>; readonly cases?: readonly Registered[] };
  for (const one of vector.cases ?? []) {
    const lines = (vector.worlds?.[one.world] ?? []).flatMap((text) => ((got) => (got.kind === 'fact' ? [{ ...got.value.fields }] : []))(parse(text)));
    const got = fromLine(one.input ?? one.line ?? '', wireAt(lines, 1));
    compare(one.expected ? { kind: got.kind, why: got.kind === 'fact' ? '' : got.why } : got.kind, one.expected ?? one.kind, one.name);
  }
});
