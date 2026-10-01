import { combine } from '@lapxo/topos/wire';
import { load } from './harness.ts';

type Case = { readonly name: string; readonly measure: string; readonly values: readonly number[]; readonly expected: number | string };

test('measures-declare-their-combination — a count sums, a longest maxes, and a measure with none is refused past one reading', () => {
  for (const one of (load('measures')['cases'] ?? []) as readonly Case[]) {
    let got: number | string;
    try { got = combine(one.measure, one.values); } catch { got = 'refused'; }
    compare(got, one.expected, one.name);
  }
});
