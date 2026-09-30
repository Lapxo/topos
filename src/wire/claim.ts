import { fact, refuse } from './types.ts';
import type { Bound, Claim, Outcome } from './types.ts';

type ClaimDraft = Partial<Claim> &
  Pick<Claim, 'scope' | 'measure' | 'bound' | 'role'>;

const ROLES: ReadonlySet<string> = new Set(['reads', 'writes', 'demands']);

const isPointBound = (b: Bound): boolean => {
  if (b.kind === 'interval') return b.lo === b.hi;
  if (b.kind === 'enumerated') return b.values.length === 1;
  return false;
};

const present = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export function claim(draft: ClaimDraft): Outcome<Claim> {
  if (!present(draft.scope)) return refuse('claim: scope is required');
  if (!present(draft.measure)) return refuse('claim: measure is required');
  if (draft.bound === undefined) return refuse('claim: bound is required');
  if (!present(draft.role) || !ROLES.has(draft.role)) {
    return refuse(`claim: role must be reads, writes, or demands, not ${String(draft.role)}`);
  }
  if (!present(draft.by)) return refuse('claim: by is required');
  if (!present(draft.at)) return refuse('claim: at is required');
  if (draft.role === 'writes' && !isPointBound(draft.bound)) {
    return refuse('claim: a write states one value');
  }
  const built: Claim = {
    scope: draft.scope,
    measure: draft.measure,
    bound: draft.bound,
    role: draft.role,
    by: draft.by,
    at: draft.at,
    ...(draft.unit !== undefined ? { unit: draft.unit } : {}),
    ...(draft.epoch !== undefined ? { epoch: draft.epoch } : {}),
    ...(draft.multiplicity !== undefined ? { multiplicity: draft.multiplicity } : {}),
    ...(draft.reference !== undefined ? { reference: draft.reference } : {}),
    ...(draft.support !== undefined ? { support: draft.support } : {}),
    ...(draft.extra !== undefined ? { extra: draft.extra } : {}),
  };
  return fact(built);
}

