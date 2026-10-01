import type { Method, MeasureForm as Form } from '@lapxo/obligations';
import type { Poset, MeetSemilattice, JoinSemilattice, Lattice } from '@lapxo/obligations/lattice';
export type { Method, Form, Poset, MeetSemilattice, JoinSemilattice, Lattice };

export { PROTOCOL } from './line.ts';
import { PROTOCOL } from './line.ts';

type Measure = {
  readonly id: string;
  readonly unit?: string;
  readonly exist?: readonly string[];
} & (
  | { readonly form: 'ladder'; readonly levels: readonly string[] }
  | { readonly form: 'alphabet'; readonly tokens: readonly string[] }
  | { readonly form: 'continuous'; readonly lo: number | null; readonly hi: number | null }
);

export type Bound =
  | { readonly kind: 'band'; readonly floor: string; readonly ceiling: string }
  | { readonly kind: 'enumerated'; readonly values: readonly string[] }
  | { readonly kind: 'interval'; readonly lo: number | null; readonly hi: number | null };

type Multiplicity = 'one' | 'many' | 'unknown';

interface Reference {
  readonly rel: 'within' | 'copies' | 'derives';
  readonly to: readonly string[];
  readonly by: 'inferred' | 'declared';
}

interface Authority {
  readonly author: string;
  readonly scopePrefix: string;
  readonly signature?: string;
}

interface Support {
  readonly observed: number;
  readonly supporters: number;
  readonly method: Method;
  readonly channel: string;
  readonly control: 'ok' | 'UNRELIABLE';
  readonly excludedRatio?: number;
}

export interface Claim {
  readonly scope: string;
  readonly measure: string;
  readonly bound: Bound;
  readonly role: 'writes' | 'reads' | 'demands';
  readonly by: string;
  readonly at: string;
  readonly unit?: string;
  readonly epoch?: string;
  readonly multiplicity?: Multiplicity;
  readonly reference?: Reference | null;
  readonly support?: Support;
  readonly extra?: Readonly<Record<string, string>>;
}

export interface Lock {
  readonly protocol: typeof PROTOCOL;
  readonly measures?: readonly Measure[];
  readonly claims?: readonly Claim[];
  readonly authorities?: readonly Authority[];
}

export type { Outcome } from './outcome.ts';
export { fact, abstain, refuse } from './outcome.ts';
