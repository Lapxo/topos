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

test('a-release-is-true-where-a-pin-names-it — a target line of a release stands only where a pin names its digest, and a key the release does not carry signs nothing', () => {
  type Pinned = { readonly name: string; readonly lock: readonly Readonly<Record<string, string>>[]; readonly line: Readonly<Record<string, string>>; readonly published?: { readonly digest: string; readonly pins: readonly string[] }; readonly verdict: string };
  const owned: Signer = { ...root, publicKey: 'K0' };
  const check = (fields: Readonly<Record<string, string>>, publicKey: string): boolean => fields['sig'] === `ok:${publicKey}`;
  for (const one of (load('published')['cases'] ?? []) as readonly Pinned[]) {
    const { admitted } = signersOf(one.lock, owned, check);
    compare(authorityOf(one.line, admitted, check, one.published).kind, one.verdict, one.name);
  }
});

test('a class signed later still admits epoch-1 lines the same lock already holds', () => {
  const owned: Signer = { ...root, publicKey: 'K0' };
  const check = (fields: Readonly<Record<string, string>>, publicKey: string): boolean => fields['sig'] === `ok:${publicKey}`;
  const lock = [
    { scope: 'keys/ci', measure: 'class', value: 'agent', by: 'owner', epoch: '408', sig: 'ok:K0' },
    { scope: 'keys/ci', measure: 'public-key', value: 'K1', by: 'owner', epoch: '408', sig: 'ok:K0' },
    { scope: 'keys/ci', measure: 'coverage', value: 'audit/**', by: 'owner', epoch: '409', sig: 'ok:K0' },
    { scope: 'keys/ci', measure: 'resolution', value: '1..16', by: 'owner', epoch: '408', sig: 'ok:K0' },
    { scope: 'audit/tree/lines', by: 'ci', epoch: '1', sig: 'ok:K1', role: 'writes', measure: 'id', form: 'alphabet', value: 'present', at: 'place:ci' },
  ];
  const { admitted } = signersOf(lock, owned, check);
  compare(authorityOf(lock[4]!, admitted, check).kind, 'admitted', 'epoch 1 body stands beside a later class');
});
