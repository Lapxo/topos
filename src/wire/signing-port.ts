import { canonical, parse, signedBytes } from './line.ts';
import { parseSignature } from './sig.ts';
import { boundOf } from './values.ts';

export interface Lot { readonly bytes: readonly string[]; readonly keyId: string; readonly algorithm: string }
export interface SignatureRecord { readonly keyId: string; readonly signature: string }

/** Proposed transport vector, not an admitted object/configuration record. */
export function requestBytes(lot: Lot): string {
  if (!lot.bytes.length) throw new Error('REFUSE·signer empty lot');
  for (const bytes of lot.bytes) {
    const got = parse(bytes);
    if (got.kind !== 'fact' || got.value.fields['sig'] !== undefined
      || got.value.fields['by'] !== lot.keyId || signedBytes(got.value.fields) !== bytes) {
      throw new Error('REFUSE·signer noncanonical payload');
    }
  }
  return lot.bytes.join('\n') + '\n';
}

export function responseBytes(records: readonly SignatureRecord[]): string {
  return records.map(record => canonical({ by: record.keyId, sig: record.signature })).join('\n') + '\n';
}

/** The existing lexical envelope carries exactly by/sig, in lot order. No authority is minted. */
export function responseOf(text: string, lot: Lot): readonly SignatureRecord[] {
  if (!text.endsWith('\n')) throw new Error('REFUSE·signer truncated response');
  const rows = text.slice(0, -1).split('\n');
  if (rows.length !== lot.bytes.length) throw new Error('REFUSE·signer response count');
  return rows.map(row => {
    const got = parse(row);
    if (got.kind !== 'fact') throw new Error('REFUSE·signer response grammar');
    const fields = got.value.fields;
    const signature = parseSignature(fields['sig'] ?? '');
    if (Object.keys(fields).length !== 2 || fields['by'] !== lot.keyId || !signature
      || signature.algorithm !== lot.algorithm || canonical(fields) !== row) {
      throw new Error('REFUSE·signer response identity or signature form');
    }
    return { keyId: fields['by'], signature: fields['sig']! };
  });
}

/** Caller supplies live admitted configuration; host resolves the logical name separately. */
export function signerSelection(lines: readonly Readonly<Record<string, string>>[], keyId: string):
  { readonly name: string; readonly timeoutMs: number; readonly responseBytes: number } {
  const value = (scope: string, measure: string): string => {
    const rows = lines.filter(f => f['scope'] === scope && f['measure'] === measure
      && f['role'] === 'writes' && f['value'] !== 'withdraw');
    const values = [...new Set(rows.map(f => f['value']))];
    if (values.length !== 1 || !values[0]) throw new Error(`REFUSE·signer ${keyId} missing or conflicting ${scope}`);
    return values[0];
  };
  const exact = (scope: string, measure: string): number => {
    if (lines.some(f => f['scope'] === scope && f['measure'] === measure
      && f['role'] === 'writes' && f['value'] !== 'withdraw' && f['form'] !== 'interval')) {
      throw new Error(`REFUSE·signer ${keyId} invalid ${scope}`);
    }
    const bound = boundOf('interval', value(scope, measure));
    if (!bound || bound.kind !== 'interval' || bound.lo === null || bound.lo !== bound.hi || !Number.isSafeInteger(bound.lo) || bound.lo <= 0) {
      throw new Error(`REFUSE·signer ${keyId} invalid ${scope}`);
    }
    return bound.lo;
  };
  return { name: value(`keys/${keyId}`, 'signer'), timeoutMs: exact('signer/timeout', 'milliseconds'),
    responseBytes: exact('signer/response-bytes', 'bytes') };
}
