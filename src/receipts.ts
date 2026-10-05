import {byBytes, canonical, parse} from './wire/line.ts';

export interface ReceiptRegion {readonly scope: string; readonly count: number; readonly digest: string}
export interface ReceiptProjection {readonly root: string; readonly regions: readonly ReceiptRegion[]}
/** Project an observed set under a declared canonical field contract. The caller supplies its digest algorithm and exclusions. */
export function receiptProjection(lines: readonly string[], fields: readonly string[], digest: (bytes: string) => string, excluded: readonly string[] = []): ReceiptProjection {
  if (!fields.length || new Set(fields).size !== fields.length || !fields.includes('scope')) throw Error('REFUSE·receipt missing or conflicting canonical field contract');
  const regions = new Map<string, Set<string>>();
  for (const line of lines) {
    const got = parse(line);
    if (got.kind !== 'fact') throw Error('REFUSE·receipt the observed set holds an invalid record');
    const f = got.value.fields;
    if (excluded.includes(f.by ?? '')) throw Error('REFUSE·receipt excluded evidence is inside its own set');
    const claim = canonical(Object.fromEntries(fields.filter(key => f[key] !== undefined).map(key => [key, f[key]!])));
    const family = (f.scope ?? '').split('/')[0] ?? '';
    (regions.get(family) ?? regions.set(family, new Set()).get(family)!).add(claim);
  }
  const parts = [...regions].map(([name, claims]) => ({scope: `receipts/${name}`, count: claims.size, digest: digest([...claims].sort(byBytes).map(line => line + '\n').join(''))})).sort((a, b) => byBytes(a.scope, b.scope));
  return {root: digest(parts.map(part => part.digest + '\n').join('')), regions: parts};
}
