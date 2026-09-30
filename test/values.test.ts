import { alphabet, atResolution, fields, steps } from '@lapxo/topos/wire';
import { load } from './harness.ts';

type Case = { readonly name: string; readonly grammar: string; readonly input: string; readonly expected: Readonly<Record<string, unknown>> };
const grammars = { alphabet, fields, steps, atResolution } as unknown as Readonly<Record<string, (given: unknown) => unknown>>;

test('value-grammars-read-back — every value of the corpus reads as the wire page says, and the text it writes reads back to the same value', () => {
  for (const one of (load('spec/values')['cases'] ?? []) as readonly Case[]) {
    const grammar = grammars[one.grammar];
    try {
      const value = grammar?.(one.input);
      const canonical = grammar?.(value) as string;
      compare({ kind: 'fact', value, canonical, roundTrip: JSON.stringify(grammar?.(canonical)) === JSON.stringify(value) }, one.expected, one.name);
    } catch (error) {
      compare({ kind: 'refuse', why: (error as Error).message }, one.expected, one.name);
    }
  }
});
