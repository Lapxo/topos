import {mixProjectionLoss} from '@lapxo/obligations/measures';
import type {ConfigurationPrior, MixLossPolicy} from '@lapxo/obligations/measures';
import {byBytes} from '../wire/line.ts';

export const PROJECTION_CHAIN_MODEL = {name:'finite-deterministic-chain-same-prior@1', contract:'sha256:34add91f4dfd04d38490f85577fcbb95059a58803c8b82c4a82af2d265a421d9', implementation:'sha256:af9c6a3dbeda91981b394b61e187f916dc0e0304801b7b654ff3e025ebce94cb'} as const;

export const PROJECTION_CHAIN_PROFILE = 'topos-projection-chain/1' as const;
export interface ProjectionChain {
  readonly profile: typeof PROJECTION_CHAIN_PROFILE;
  readonly atoms: readonly string[];
  readonly f: readonly (readonly [string, string])[];
  readonly g: readonly (readonly [string, string])[];
  readonly direct?: readonly (readonly [string, string])[];
  readonly prior?: ConfigurationPrior;
  readonly policy: MixLossPolicy;
}
const refuse = (cause: string): never => { throw Error(`REFUSE·${cause}`); };
const name = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && !/[\u0000\r\n]/.test(x);
function mapping(input: unknown, domain: readonly string[]) {
  if (!Array.isArray(input) || input.length !== domain.length) return refuse('projection/non-chain');
  const result = new Map<string, string>();
  for (const row of input) {
    if (!Array.isArray(row) || row.length !== 2 || !name(row[0]) || !name(row[1])) return refuse('projection/randomized-map');
    if (!domain.includes(row[0]) || result.has(row[0])) return refuse('projection/non-chain');
    result.set(row[0], row[1]);
  }
  return result;
}
/** One finite deterministic chain; all entropy and rational arithmetic belongs to Obligations. */
export function measureProjectionChain(input: ProjectionChain) {
  if (!input || typeof input !== 'object' || input.profile !== PROJECTION_CHAIN_PROFILE) return refuse('projection/profile');
  if (Object.keys(input).some(k => !['profile','atoms','f','g','direct','prior','policy'].includes(k))) return refuse('projection/changed-prior');
  if (!Array.isArray(input.atoms) || !input.atoms.length || !input.atoms.every(name) || new Set(input.atoms).size !== input.atoms.length) return refuse('projection/domain');
  const policy = input.policy;
  if (!policy || policy.logarithm !== 'binary64-log2' || typeof policy.budget !== 'string' || !/^(0|[1-9][0-9]*)$/.test(policy.budget) || Object.keys(policy).some(k => k !== 'logarithm' && k !== 'budget')) return refuse('projection/policy');
  // A budget covers the three model evaluations, in declared configurations, not elapsed time.
  const minimum = 2n * BigInt(input.atoms.length) + 1n;
  if (minimum > BigInt(policy.budget)) return {status:'unmeasured' as const, cause:'mix-loss/work-budget' as const, workUnit:'declared-configurations' as const};
  const atoms = [...input.atoms].sort(byBytes), f = mapping(input.f, atoms);
  const ys = [...new Set(f.values())].sort(byBytes), g = mapping(input.g, ys);
  if (input.direct !== undefined) {
    const direct = mapping(input.direct, atoms);
    if (atoms.some(x => direct.get(x) !== g.get(f.get(x)!))) return refuse('projection/non-chain');
  }
  const required = 2n * BigInt(atoms.length) + BigInt(ys.length);
  if (required > BigInt(policy.budget)) return {status:'unmeasured' as const, cause:'mix-loss/work-budget' as const, required:String(required), workUnit:'declared-configurations' as const};
  const project = (domain: readonly string[], map: ReadonlyMap<string,string>, prior?: ConfigurationPrior) => mixProjectionLoss({
    factors:[{id:'source',weight:'0'},{id:'projection',weight:'1'}],
    alphabet:[...new Set([...domain, ...map.values()])].sort(byBytes),
    configurations:domain.map(id => ({id,values:[id,map.get(id)!]})),
    ...(prior === undefined ? {} : {prior}),
  }, policy);
  const xy = project(atoms, f, input.prior);
  if (xy.status === 'unmeasured') return xy;
  // Exact pushforward probabilities are returned by Obligations, never independently chosen.
  const priorY: ConfigurationPrior = {kind:'explicit', probabilities:xy.outputs.map(row => {
    if (row.output.kind !== 'value') return refuse('projection/non-chain');
    return {configuration:row.output.value,p:row.probability};
  })};
  const yz = project(ys, g, priorY);
  const xz = project(atoms, new Map(atoms.map(x => [x,g.get(f.get(x)!)!])), {kind:'explicit',probabilities:xy.prior.probabilities});
  if (yz.status !== 'measured' || xz.status !== 'measured') return refuse('projection/evaluation');
  return {status:'measured' as const, profile:PROJECTION_CHAIN_PROFILE, model:PROJECTION_CHAIN_MODEL,
    unit:'bits' as const, approximation:'binary64-log2' as const, work:{unit:'declared-configurations',required:String(required)},
    parameters:{atoms,f:atoms.map(x=>[x,f.get(x)!]),g:ys.map(y=>[y,g.get(y)!]),prior:xy.prior,policy},
    loss:{xy:xy.lossBits,yz:yz.lossBits,xz:xz.lossBits}, residualBits:xz.lossBits-xy.lossBits-yz.lossBits,
    certification:'finite model evaluation; not a general Lean certificate' as const};
}
