/**
 * A topos as a container. It lowers to an inert descriptor; it does not invent
 * a fifth class or a universal composition law.
 */
import { intervals } from '@lapxo/obligations';
import type { Claim } from '../wire/types.ts';
import { claim } from '../wire/claim.ts';
import { emptyDescriptor } from '../wire/descriptor.ts';
import type { ToposDescriptor } from '../wire/descriptor.ts';
import type { Bindings } from './bindings.ts';

/** A seen row has no origin: the SDK stamps by= and at= from what it handed over, and observe(bytes, digest) turns bytes into seen rows with no files, no store, no clock and no network. */
type Seen = {
  readonly scope: string;
  readonly measure: string;
  readonly role: Claim['role'];
  readonly bound: Claim['bound'];
  readonly unit?: string;
};

type Observe = (bytes: Uint8Array, digest: string) => readonly Seen[];

export interface DefinedTopos {
  readonly kind: 'defined';
  readonly id: string;
  readonly includes: readonly string[];
  readonly members: readonly unknown[];
  readonly claims: readonly Claim[];
  readonly descriptor: ToposDescriptor;
  readonly bindings: Bindings;
  readonly domain?: readonly string[];
  readonly observe?: Observe;
}

const asClaim = (draft: Parameters<typeof claim>[0]): Claim => {
  const judged = claim(draft);
  if (judged.kind !== 'fact') {
    throw new Error(judged.why);
  }
  return judged.value;
};

const SPANS = intervals(-Infinity, Infinity);

/** A region's cost is a fold of what was observed: the join of the spans its runs took, and none while it is only declared. */
export const costOf = (observed: readonly (readonly [number, number])[]): { readonly cost?: readonly [number, number] } =>
  ((held) => (SPANS.inhabited(held) ? { cost: [held.lo, held.hi] } : {}))(observed.reduce((all, [lo, hi]) => SPANS.join(all, { lo, hi }), SPANS.bottom));

export function defineTopos(opts: {
  readonly id: string;
  readonly includes?: readonly string[];
  readonly members?: readonly unknown[];
  readonly by?: string;
  readonly bindings?: Bindings;
  readonly domain?: readonly string[];
  readonly observe?: Observe;
}): DefinedTopos {
  const by = opts.by ?? opts.id;
  const includes = opts.includes ?? [];
  const members = opts.members ?? [];
  const claims: Claim[] = opts.observe
    ? []
    : [
      asClaim({
        scope: `topos/${opts.id}/class`,
        measure: 'kind',
        role: 'reads',
        by,
        at: opts.id,
        bound: { kind: 'enumerated', values: ['readers'] },
      }),
      ...includes.map((ref) => asClaim({
        scope: `topos/${opts.id}/includes`,
        measure: 'id',
        role: 'reads',
        by,
        at: opts.id,
        bound: { kind: 'enumerated', values: [ref] },
        reference: { rel: 'within', to: [`topos/${ref}`], by: 'declared' },
      })),
    ];
  const descriptor: ToposDescriptor = {
    ...emptyDescriptor(opts.id),
    includes,
    claims,
  };
  return {
    kind: 'defined',
    id: opts.id,
    includes,
    members,
    claims,
    descriptor,
    bindings: opts.bindings ?? {},
    ...(opts.domain ? { domain: opts.domain } : {}),
    ...(opts.observe ? { observe: opts.observe } : {}),
  };
}

