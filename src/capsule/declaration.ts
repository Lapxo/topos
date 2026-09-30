import { matches } from '../wire/classes.ts';
import { alphabet } from '../wire/grammar.ts';
import { parse } from '../wire/line.ts';
import type { Handed } from './asked.ts';

export interface Declaration {
  readonly domain: string;
  readonly runtime?: string;
  readonly holds?: string;
  readonly pins: Readonly<Record<string, string>>;
  readonly renders: readonly string[];
  readonly reads: readonly string[];
  readonly regions: Readonly<Record<string, readonly string[]>>;
  readonly writes: Readonly<Record<string, string>>;
  readonly effects: readonly string[];
}

const standing = (lines: readonly string[]): readonly Handed[] => lines.flatMap((line) => {
  const got = parse(line);
  return got.kind === 'fact' && got.value.fields['value'] !== 'withdraw' ? [got.value.fields] : [];
});

/**
 * What a capsule's own lock says of it: the domain it serves, the runtime the host starts it with, where its world holds
 * its values, the release it pins of each package it bundles, and one line per region — what the region reads, and its
 * role: a render writes a page, a receipt is a reader's claims. The paths a place's regions cover are lines of another
 * measure and no region of the capsule. A lock of the older shape names its regions in one list and their reads one line
 * each; one that reads as one is read as one. A region no line names reads nothing and is refused.
 */
export function declarationOf(lines: readonly string[]): Declaration {
  const held = standing(lines);
  const said = (scope: string): readonly string[] => held.filter((fields) => fields['scope'] === scope)
    .flatMap((fields) => alphabet(fields['value'] ?? '').members);
  const own = held.filter((fields) => (fields['scope'] ?? '').startsWith('region/') && fields['measure'] === 'reads');
  const named = (fields: Handed, prefix: string): string => (fields['scope'] ?? '').slice(prefix.length);
  const reading = (scope: string): readonly string[] => own.filter((fields) => fields['scope'] === scope).flatMap((fields) => alphabet(fields['value'] ?? '').members);
  const regions = Object.fromEntries(own.length ? own.map((fields) => [named(fields, 'region/'), reading(fields['scope'] ?? '')] as const)
    : held.filter((fields) => (fields['scope'] ?? '').startsWith('capsule/reads/')).map((fields) => [named(fields, 'capsule/reads/'), said(fields['scope'] ?? '')] as const));
  const [runtime, holds] = [said('capsule/runtime')[0], said('capsule/holds')[0]];
  return {
    domain: said('capsule/domain')[0] ?? '',
    ...(runtime === undefined ? {} : { runtime }),
    ...(holds === undefined ? {} : { holds }),
    pins: Object.fromEntries(held.filter((fields) => (fields['scope'] ?? '').startsWith('capsule/') && fields['measure'] === 'digest')
      .map((fields) => [named(fields, 'capsule/'), fields['value'] ?? ''] as const)),
    renders: own.length ? own.filter((fields) => fields['role'] === 'render').map((fields) => named(fields, 'region/')) : said('capsule/regions'),
    reads: [...new Set([...said('capsule/reads'), ...Object.values(regions).flat()])],
    regions,
    writes: Object.fromEntries(own.map((fields) => [named(fields, 'region/'), fields['role'] ?? ''] as const)),
    effects: said('capsule/effects'),
  };
}

export const readsOf = (declaration: Declaration, region: string): readonly string[] | undefined =>
  (Object.keys(declaration.regions).length ? declaration.regions[region] : declaration.reads);

/**
 * The lines a capsule sees, handed by the contract: the standing lines of the place that lie in a region its own lock
 * reads, parsed by the wire. Nothing else of the lock reaches it, and no file does.
 */
export function handed(reads: readonly string[], lines: readonly string[]): readonly Handed[] {
  return standing(lines).filter((fields) => reads.some((region) => matches(region, fields['scope'] ?? '')));
}
