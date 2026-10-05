import { alphabet, parse } from '../wire/index.ts';

export type Declared =
  | { readonly kind: 'finite'; readonly form: 'alphabet' | 'interval'; readonly bits: number; readonly premium: number; readonly degenerate: true; readonly distributive: true }
  | { readonly kind: 'continuous' | 'unbounded' | 'complement' | 'unsupported' | 'invalid' | 'inactive'; readonly bits: null; readonly premium: null; readonly degenerate: null; readonly why: string; readonly distributive: boolean | null };

const unknown = (kind: Exclude<Declared['kind'], 'finite'>, why: string, distributive: boolean | null = null): Declared => ({ kind, bits: null, premium: null, degenerate: null, why, distributive });

/** Compare wire decimals without rounding distinct endpoints to the same floating-point number. */
function compareDecimal(left: string, right: string): number {
  const rational = (text: string): { readonly numerator: bigint; readonly scale: bigint } => {
    const [integer = '', fraction = ''] = text.split('.');
    return { numerator: BigInt(`${integer}${fraction}`), scale: 10n ** BigInt(fraction.length) };
  };
  const a = rational(left);
  const b = rational(right);
  const difference = a.numerator * b.scale - b.numerator * a.scale;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

/**
 * A permitted alphabet is a subset lattice: n distinct tokens permit 2^n subsets, hence n bits. Its cardinality
 * valuation is modular, since |A|+|B| = |A union B|+|A intersection B|. The obligations premium therefore vanishes
 * for every declaration. Neither the powerset nor its order matrix needs to be materialized.
 *
 * An interval does not declare a discrete step. A non-singleton continuous band has no state count under the wire
 * contract, even when both endpoints happen to be integers; missing cardinality is not infinite measured freedom.
 */
export function declaredConfig(line: string): Declared {
  const got = parse(line);
  if (got.kind !== 'fact') return unknown('invalid', got.why);
  const { form, value, type } = got.value.fields;
  if (type !== undefined) return unknown('unsupported', 'object freedom needs its selected valuation; a configuration estimate cannot measure it');
  if (form === undefined || value === undefined) return unknown('invalid', 'a declaration must name its form and value');
  if (value === 'withdraw') return unknown('inactive', 'a withdrawal declares no current freedom');
  if (form === 'alphabet') {
    let tokens: { readonly polarity: 'permit' | 'forbid'; readonly members: readonly string[] };
    try { tokens = alphabet(value); }
    catch (error) { return unknown('invalid', error instanceof Error ? error.message : String(error)); }
    if (tokens.polarity === 'forbid') return unknown('complement', 'the complement names exclusions but declares no universe to count');
    return { kind: 'finite', form, bits: new Set(tokens.members).size, premium: 0, degenerate: true, distributive: true };
  }
  if (form === 'interval') {
    const [lo = '', hi = ''] = value.split('..');
    if (lo === '*' || hi === '*') return unknown('unbounded', 'the interval has an open endpoint and declares no discrete state count', false);
    // The wire parser already validated decimal syntax. Equality and empty bands each leave no decision.
    const comparison = compareDecimal(lo, hi);
    if (comparison >= 0) return { kind: 'finite', form, bits: 0, premium: 0, degenerate: true, distributive: true };
    return unknown('continuous', 'the interval declares no discrete step or state count', false);
  }
  return unknown('unsupported', `freedom is not defined here for form ${form}`);
}
