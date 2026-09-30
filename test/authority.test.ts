import { authorityOf, signersOf } from '@lapxo/topos/wire';
import type { Signer } from '@lapxo/topos/wire';
import { load } from './harness.ts';

type Probe = { readonly by: string; readonly scope: string; readonly epoch: number; readonly kind: string };
type Case = { readonly name: string; readonly lines: readonly Readonly<Record<string, string>>[]; readonly coverage: Readonly<Record<string, readonly string[]>>; readonly probes: readonly Probe[] };
const root: Signer = { id: 'owner', keyClass: 'authorize', publicKey: '', coverage: ['*'], depth: { lo: 1, hi: 16 }, admittedBy: [] };

test('coverage-honours-withdraws — a withdrawn coverage covers nothing signed after it, and the standing lines are the coverage', () => {
  for (const one of (load('coverage-honours-withdraws')['cases'] ?? []) as readonly Case[]) {
    const { admitted } = signersOf(one.lines, root, () => true);
    compare(Object.fromEntries(admitted.filter((signer) => signer.id in one.coverage).map((signer) => [signer.id, [...signer.coverage].sort()])), one.coverage, one.name);
    compare(one.probes.map((probe) => authorityOf({ scope: probe.scope, by: probe.by, epoch: String(probe.epoch), sig: 'x', role: 'writes', measure: 'id', form: 'alphabet', value: 'withdraw', at: 'witness:probe' }, admitted, () => true).kind), one.probes.map((probe) => probe.kind), one.name);
  }
});

test('window-honours-withdraws — a withdrawn window allows nothing signed after it, and a line is judged by the windows standing when it was signed', () => {
  for (const one of (load('window-honours-withdraws')['cases'] ?? []) as readonly (Omit<Case, 'coverage'> & { readonly closes: Readonly<Record<string, number>> })[]) {
    const { admitted } = signersOf(one.lines, root, () => true);
    compare(Object.fromEntries(admitted.filter((signer) => signer.id in one.closes).map((signer) => [signer.id, signer.epoch?.close ?? null])), one.closes, one.name);
    compare(one.probes.map((probe) => authorityOf({ scope: probe.scope, by: probe.by, epoch: String(probe.epoch), sig: 'x', role: 'writes', measure: 'id', form: 'alphabet', value: 'withdraw', at: 'witness:probe' }, admitted, () => true).kind), one.probes.map((probe) => probe.kind), one.name);
  }
});
