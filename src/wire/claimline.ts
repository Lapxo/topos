/**
 * The wire reads itself: a claim is read by the lock of the wire that stood when it was signed. Its fields, their
 * alphabets and forms, and the algorithms its digests and signatures name, are lines of that lock with an epoch —
 * never a grammar compiled here and never a file this reads. What stays compiled is the line and the forms of the
 * algebra; every name the wire admits arrives as a claim. The fields that say who signed and when, its envelope, never
 * make two claims different claims.
 */
import { intervals } from '@lapxo/obligations';
import type { Interval } from '@lapxo/obligations';
import { objectFromFields } from './object-record.ts';
import type { ObjectGrammar, ObjectRecord } from './object-record.ts';
import { parse as parseLine } from './line.ts';
import { abstain, fact, refuse } from './outcome.ts';
import type { Outcome } from './outcome.ts';
import type { Claim } from './types.ts';
import { unpipe, boundOf, REF_RELATIONS, BOUND_FORMS } from './values.ts';
import type { FormGrammar } from './values.ts';
import { outranks, passes, region, resolution, within } from '@lapxo/obligations/field';
import { parseSignature } from './sig.ts';
import { under } from '../authority/admit.ts';
import type { KeyClass } from '../authority/motion.ts';


export const ENVELOPE: ReadonlySet<string> = new Set(['sig', 'expires', 'repo', 'by', 'epoch']);

const WITHDRAW = 'withdraw';

export interface Wire {
  readonly object?: ObjectGrammar;
  readonly epoch: number;
  readonly fields: ReadonlySet<string>;
  readonly required: ReadonlySet<string>;
  readonly roles: ReadonlySet<string>;
  readonly forms: ReadonlySet<string>;
  readonly classes: ReadonlySet<string>;
  readonly digests: ReadonlySet<string>;
  readonly signatures: ReadonlySet<string>;
  readonly formOf: ReadonlyMap<string, string>;
  readonly lists: ReadonlyMap<string, ReadonlySet<string>>;
}

const WIRE = 'wire/';
const WAS = 'audit/wire/';

export function isWireClaim(fields: Readonly<Record<string, string>>): boolean {
  const scope = fields['scope'] ?? '';
  return scope.startsWith(WIRE) || scope.startsWith(WAS);
}

function listOf(scope: string): string | undefined {
  if (scope.startsWith(WAS)) return scope.slice(WAS.length);
  if (scope.startsWith(WIRE)) return scope.slice(WIRE.length);
  return undefined;
}

function epochOf(fields: Readonly<Record<string, string>>): number {
  const value = fields['epoch'] ?? '';
  return /^\d+$/.test(value) ? Number(value) : 0;
}

function names(withdraw: Readonly<Record<string, string>>, line: Readonly<Record<string, string>>): boolean {
  return Object.keys(withdraw).filter((k) => k !== 'value' && !ENVELOPE.has(k)).every((k) => line[k] === withdraw[k]);
}

export function wireAt(lines: readonly Readonly<Record<string, string>>[], epoch: number): Wire | null {
  const mine = lines.filter((f) => listOf(f['scope'] ?? '') !== undefined && epochOf(f) <= epoch);
  const withdrawals = mine.filter((f) => f['value'] === WITHDRAW);
  const standing = new Map<string, Readonly<Record<string, string>>>();
  for (const f of mine) {
    const key = listOf(f['scope'] ?? '') ?? '';
    if (f['value'] === WITHDRAW || withdrawals.some((w) => names(w, f))) continue;
    const held = standing.get(key);
    const newer = held === undefined || epochOf(f) > epochOf(held)
      || (epochOf(f) === epochOf(held) && (f['scope'] ?? '').startsWith(WIRE) && (held['scope'] ?? '').startsWith(WAS));
    if (newer) standing.set(key, f);
  }
  if (!standing.size) return null;
  const ids = (name: string): ReadonlySet<string> => new Set((standing.get(name)?.['value'] ?? '').split('|').filter(Boolean));
  const formOf = new Map([...standing]
    .filter(([name]) => name.startsWith('form/'))
    .map(([name, f]) => [name.slice('form/'.length), f['value'] ?? ''] as const));
  const lists = new Map([...standing.keys()]
    .filter((name) => !name.includes('/'))
    .map((name) => [name, ids(name)] as const));
  return {
    epoch,
    ...(standing.has('object/types') ? {object: {
      activation: epochOf(standing.get('object/types')!),
      types: ids('object/types'), common: ids('object/common'), reserved: ids('object/reserved'), configuration: ids('object/allowed/config'),
      required: new Map([...standing.keys()].filter(k => k.startsWith('object/required/')).map(k => [k.slice('object/required/'.length),ids(k)])),
      allowed: new Map([...standing.keys()].filter(k => k.startsWith('object/allowed/')).map(k => [k.slice('object/allowed/'.length),ids(k)])),
    }} : {}),
    fields: ids('fields'),
    required: ids('required'),
    roles: ids('roles'),
    forms: ids('forms'),
    classes: ids('at-classes'),
    digests: new Set([...ids('digest-algorithms')].map((one) => one.split(':')[0]!)),
    signatures: ids('signature-algorithms'),
    formOf,
    lists,
  };
}

function admittedDigest(value: string, wire: Wire): boolean {
  const colon = value.indexOf(':');
  return colon > 0 && wire.digests.has(value.slice(0, colon)) && /^[0-9a-f]+$/i.test(value.slice(colon + 1));
}

function isRegion(need: string): boolean {
  if (need.startsWith('/') || /[\s\\]/.test(need)) return false;
  const steps = need.split('/').filter((step) => step !== '');
  return steps.length > 0 && steps.every((step, i) => step !== '.' && step !== '..' && (!step.includes('*') || i === steps.length - 1));
}

const FIELD_FORMS: Readonly<Record<string, (value: string, wire: Wire) => boolean>> = {
  region: (value) => value.split('|').filter(Boolean).every(isRegion),
  class: (value, wire) => {
    const colon = value.indexOf(':');
    if (colon <= 0 || !wire.classes.has(value.slice(0, colon))) return false;
    const rest = value.slice(colon + 1);
    return !/^[a-z0-9-]+:[0-9a-f]{16,}$/i.test(rest) || admittedDigest(rest, wire);
  },
  signature: (value, wire) => {
    const got = parseSignature(value);
    if (got === null || !wire.signatures.has(got.algorithm)) return false;
    const era = got.algorithm.slice(got.algorithm.lastIndexOf(':') + 1);
    return admittedDigest(got.algorithm, wire) || (got.algorithm.includes(':') && (wire.lists.get('era')?.has(era) ?? false));
  },
  count: (value) => /^\d+$/.test(value),
};

function debit(field: string, why: string): Outcome<Claim> {
  return refuse(why, field);
}

export function fromLine(text: string, wire: null, grammars?: readonly FormGrammar[]): Outcome<Claim>;
export function fromLine(text: string, wire: Wire | null, grammars?: readonly FormGrammar[]): Outcome<Claim | ObjectRecord>;
export function fromLine(text: string, wire: Wire | null, grammars?: readonly FormGrammar[]): Outcome<Claim | ObjectRecord> {
  const line = parseLine(text, {preserveKeys:true});
  if (line.kind !== 'fact') {
    return line.kind === 'abstain' ? abstain(line.why) : refuse(line.why, line.named);
  }
  const f = line.value.fields;
  const keys = line.value.keys!;
  if (keys.includes('type')) {
    if (!wire?.object) return refuse('typed object grammar is not admitted at this epoch','type');
    if (!wire.object.configuration.size || !wire.object.reserved.size || [...wire.object.reserved].some(k=>wire.object!.configuration.has(k))) return refuse('typed wire has no closed configuration/object field contract','type');
    const got = objectFromFields(f, keys, wire.object, wire.fields, wire.forms);
    if(got.kind!=='fact') return got;
    if(!FIELD_FORMS.signature!(f.sig!,wire)) return refuse('object signature grammar is not admitted','sig');
    if(got.value.record==='cell'&&!admittedDigest(f.topos!,wire)) return refuse('cell topos is not an admitted digest','topos');
    if(got.value.record==='cell'&&(f.restsOn??'').split('|').some(name=>admittedDigest(name,wire))) return refuse('cell restsOn names coordinates, not byte digests','restsOn');
    return got;
  }
  if (wire) {
    if (wire.object) {
      if (!wire.object.configuration.size || !wire.object.reserved.size || [...wire.object.reserved].some(k=>wire.object!.configuration.has(k))) return refuse('typed wire has no closed configuration/object field contract','type');
      const reserved = keys.find(k => wire.object!.reserved.has(k) || !wire.object!.configuration.has(k));
      if (reserved) return refuse(`\`${reserved}=\` is an object-only field: untyped configuration cannot carry it`, reserved);
    }
    for (const k of Object.keys(f)) if (!wire.fields.has(k)) return debit(k, `\`${k}=\` is not a field of the wire at epoch ${wire.epoch}`);
    for (const k of wire.required) if (f[k] === undefined) return debit(k, `a claim with no \`${k}\``);
    for (const [k, form] of wire.formOf) {
      const v = f[k];
      if (v === undefined) continue;
      const ids: ReadonlySet<string> | undefined = wire.lists.get(form);
      const reads: ((value: string, wire: Wire) => boolean) | undefined = FIELD_FORMS[form] ?? (ids ? (value: string) => ids.has(value) : undefined);
      if (!reads) return abstain(`\`${k}\` takes the form ${form}, which this reader does not know`);
      if (!reads(v, wire)) return debit(k, `\`${k}=${v}\` is not a ${form} of the wire at epoch ${wire.epoch}`);
    }
    if (f.role !== undefined && !wire.roles.has(f.role)) return abstain(`\`role=${f.role}\` is a role this wire does not name`);
    if (!wire.forms.has(f.form ?? '')) return abstain(`\`form=${f.form}\` is a form this wire does not name`);
  }
  const listed = Array.isArray(grammars) ? grammars : undefined;
  const bound = f.value === WITHDRAW ? { kind: 'enumerated' as const, values: [WITHDRAW] } : boundOf(f.form ?? '', f.value ?? '', listed);
  if (bound === null) {
    const mine = (BOUND_FORMS as readonly string[]).includes(f.form ?? '') || (listed?.some((g) => g.form === f.form) ?? false);
    return mine
      ? debit('value', `\`${f.value}\` is not a ${f.form}`)
      : abstain(`\`form=${f.form}\` is a form this reader does not know`);
  }
  const role: Claim['role'] = f.role === 'writes' ? 'writes' : f.role === 'demands' ? 'demands' : 'reads';
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (['scope', 'measure', 'form', 'value', 'by', 'at', 'role', 'unit', 'multiplicity', 'epoch', 'ref', 'to', 'ref_by'].includes(k)) continue;
    extra[k] = v;
  }
  const rel = f.ref;
  const to = f.to === undefined ? null : unpipe(f.to);
  const reference = rel && to && (REF_RELATIONS as readonly string[]).includes(rel)
    ? { rel, to, by: f.ref_by === 'declared' ? 'declared' as const : 'inferred' as const }
    : null;
  return fact({
    scope: f.scope ?? '',
    measure: f.measure ?? '',
    bound,
    role,
    by: f.by ?? '',
    at: f.at ?? '',
    ...(f.unit !== undefined ? { unit: f.unit } : {}),
    ...(f.multiplicity === 'one' || f.multiplicity === 'many' || f.multiplicity === 'unknown'
      ? { multiplicity: f.multiplicity }
      : {}),
    ...(f.epoch !== undefined ? { epoch: f.epoch } : {}),
    ...(reference ? { reference } : {}),
    extra,
  } as Claim);
}

export interface Signer {
  readonly id: string;
  readonly keyClass: KeyClass;
  readonly publicKey: string;
  readonly coverage: readonly string[];
  readonly spans?: readonly { readonly globs: readonly string[]; readonly from: number; readonly to: number | null }[];
  readonly depth: { readonly lo: number; readonly hi: number };
  readonly admittedBy: readonly string[];
  readonly epoch?: { readonly start: number; readonly close: number | null };
  readonly windows?: readonly { readonly lo: number; readonly hi: number; readonly from: number; readonly to: number | null }[];
}

type Verify = (fields: Readonly<Record<string, string>>, publicKey: string) => boolean;

export type SignerVerdict =
  | { readonly kind: 'admitted'; readonly signer: string }
  | { readonly kind: 'grey'; readonly why: string }
  | { readonly kind: 'refuse'; readonly why: string; readonly named: string };

const KEYS = 'keys';

export function isKeyClaim(fields: Readonly<Record<string, string>>): boolean {
  const scope = fields['scope'] ?? '';
  return scope === KEYS || scope.startsWith(`${KEYS}/`);
}

function depthWindow(value: string): { readonly lo: number; readonly hi: number } | null {
  const m = /^(\d+)\.\.(\d+)$/.exec(value);
  return m ? { lo: Number(m[1]), hi: Number(m[2]) } : null;
}

const EPOCHS = intervals(-Infinity, Infinity);
const QUORUMS = intervals(1, Infinity);

function windowOf(signer: Signer): { readonly start: number; readonly close: number | null } {
  return signer.epoch ?? { start: 0, close: null };
}

export function windowAt(signer: Signer, epoch: number): { readonly start: number; readonly close: number | null } {
  const now = windowOf(signer);
  const standing = (signer.windows ?? []).filter((w) => epoch >= w.from && (w.to === null || epoch < w.to));
  return standing.length ? { start: now.start, close: standing.reduce((held, w) => EPOCHS.meet(held, w), EPOCHS.top).hi } : now;
}

function inside(signer: Signer, epoch: number): boolean {
  const w = windowAt(signer, epoch);
  return epoch >= w.start && (w.close === null || epoch <= w.close);
}

function standsUntil(said: readonly Readonly<Record<string, string>>[]): (f: Readonly<Record<string, string>>) => number | null {
  const claim = (f: Readonly<Record<string, string>>): string => [f['role'], f['form'], f['at']].join(' ');
  const withdrawn = new Map<string, Interval>();
  for (const f of said) if (f['value'] === 'withdraw') withdrawn.set(claim(f), EPOCHS.meet(withdrawn.get(claim(f)) ?? EPOCHS.top, { lo: -Infinity, hi: epochOf(f) }));
  return (f) => withdrawn.get(claim(f))?.hi ?? null;
}

/**
 * What a key covers, and when it may sign, line by line: each coverage or epoch line stands from the epoch it was signed
 * at until a withdraw of the same claim, named by its at, lands; what it allowed before stays allowed for what was signed
 * then, and nothing signed after is allowed by it. Windows standing together close at the nearer, so only a withdraw
 * widens, and never for a line signed before it. A withdrawn line is never counted again.
 */
function coverageOver(said: readonly Readonly<Record<string, string>>[]): { readonly coverage: readonly string[]; readonly spans: readonly { readonly globs: readonly string[]; readonly from: number; readonly to: number | null }[] } {
  const until = standsUntil(said);
  const spans = said.filter((f) => f['value'] !== 'withdraw').map((f) => ({ globs: (f['value'] ?? '').split('|').filter(Boolean), from: epochOf(f), to: until(f) }))
    .filter((span) => span.to === null || span.from < span.to);
  return { coverage: [...new Set(spans.filter((span) => span.to === null).flatMap((span) => span.globs))], spans };
}
function windowsOver(said: readonly Readonly<Record<string, string>>[]): readonly { readonly lo: number; readonly hi: number; readonly from: number; readonly to: number | null }[] {
  const until = standsUntil(said);
  return said.filter((f) => f['value'] !== 'withdraw').flatMap((f) => ((w) => (w === null ? [] : [{ ...w, from: epochOf(f), to: until(f) }]))(depthWindow(f['value'] ?? '')))
    .filter((w) => w.to === null || w.from < w.to);
}

export function signersOf(
  lines: readonly Readonly<Record<string, string>>[],
  root: Signer,
  verify: Verify,
): { readonly admitted: readonly Signer[]; readonly potential: readonly string[] } {
  const quorumLines = lines
    .filter((f) => f['scope'] === KEYS && f['measure'] === 'quorum' && f['by'] === root.id && verify(f, root.publicKey))
    .sort((a, b) => epochOf(a) - epochOf(b));
  const quorumAt = (epoch: number): number => {
    const standing = quorumLines.filter((f) => epochOf(f) <= epoch).pop();
    return QUORUMS.meet(QUORUMS.top, depthWindow(standing?.['value'] ?? '') ?? QUORUMS.top).lo;
  };
  const ids = [...new Set(lines
    // Only authority declarations introduce candidates; host transport metadata does not.
    .filter(f => ['class', 'public-key', 'coverage', 'epoch'].includes(f['measure'] ?? ''))
    .map((f) => f['scope'] ?? '')
    .filter((scope) => scope.startsWith(`${KEYS}/`))
    .map((scope) => scope.slice(KEYS.length + 1)))];
  const closedAt = (signer: Signer, closes: ReadonlyMap<string, number>): Signer => {
    const close = closes.get(signer.id);
    return close === undefined ? signer : { ...signer, epoch: { start: windowOf(signer).start, close } };
  };
  const claimsOn = (admitted: ReadonlyMap<string, Signer>, id: string, measure: string): Readonly<Record<string, string>>[] =>
    lines.filter((f) => {
      const admitter = admitted.get(f['by'] ?? '');
      return f['scope'] === `${KEYS}/${id}` && f['measure'] === measure && admitter !== undefined
        && admitter.keyClass === 'authorize' && inside(admitter, epochOf(f)) && verify(f, admitter.publicKey);
    });
  const admitUnder = (closes: ReadonlyMap<string, number>): Map<string, Signer> => {
    const admitted = new Map<string, Signer>([[root.id, closedAt(root, closes)]]);
    for (let grew = true; grew;) {
      grew = false;
      for (const id of ids) {
        if (admitted.has(id)) continue;
        const classLines = claimsOn(admitted, id, 'class');
        const withdrawn = new Set(classLines.filter((f) => f['value'] === 'withdraw').map((f) => `${f['by'] ?? ''} ${f['at'] ?? ''}`));
        const counted = classLines
          .filter((f) => f['value'] !== 'withdraw' && !withdrawn.has(`${f['by'] ?? ''} ${f['at'] ?? ''}`))
          .sort((a, b) => epochOf(a) - epochOf(b));
        const history = classLines.filter((f) => f['value'] !== 'withdraw').sort((a, b) => epochOf(a) - epochOf(b));
        const admitters: string[] = [];
        let start: number | null = null;
        for (const f of history) {
          const by = f['by'] ?? '';
          if (!admitters.includes(by)) admitters.push(by);
          if (admitters.length >= quorumAt(epochOf(f))) {
            start = epochOf(f);
            break;
          }
        }
        const publicKey = claimsOn(admitted, id, 'public-key')[0]?.['value'] ?? '';
        if (start === null || !counted.length || !publicKey) continue;
        const born = lines.some((f) => (f['by'] ?? '') === id && epochOf(f) === 1 && !(f['scope'] ?? '').startsWith(`${KEYS}/`));
        const covered = coverageOver(claimsOn(admitted, id, 'coverage'));
        admitted.set(id, closedAt({
          id,
          keyClass: counted.every((f) => f['value'] === 'authorize') ? 'authorize' : 'attest',
          publicKey,
          coverage: covered.coverage,
          spans: born ? covered.spans.map((span) => ({ ...span, from: Math.min(span.from, 1) })) : covered.spans,
          windows: windowsOver(claimsOn(admitted, id, 'epoch')),
          depth: depthWindow(claimsOn(admitted, id, 'resolution')[0]?.['value'] ?? '') ?? { lo: 1, hi: 1 },
          admittedBy: admitters,
          epoch: { start: born ? Math.min(start, 1) : start, close: null },
        }, closes));
        grew = true;
      }
    }
    return admitted;
  };
  let closes = new Map<string, number>();
  for (let round = 0; round <= ids.length + 1; round++) {
    const admitted = admitUnder(closes);
    const next = new Map<string, number>();
    for (const id of admitted.keys()) {
      const standing = windowsOver(claimsOn(admitted, id, 'epoch')).filter((w) => w.to === null);
      if (standing.length) next.set(id, standing.reduce((held, w) => EPOCHS.meet(held, w), EPOCHS.top).hi);
    }
    const moved = next.size !== closes.size || [...next].some(([id, close]) => closes.get(id) !== close);
    if (!moved) return { admitted: [...admitted.values()], potential: ids.filter((id) => !admitted.has(id)) };
    closes = next;
  }
  const admitted = admitUnder(closes);
  return { admitted: [...admitted.values()], potential: ids.filter((id) => !admitted.has(id)) };
}

/** A lock read as a release: the digest of the bytes it came in, and the digests the installer's sources/ and uses/ lines name. */
export interface Published {
  readonly digest: string;
  readonly pins: readonly string[];
}

/**
 * Who stands behind a line. In a lock read as a release, a target line carries no signature: the pin that names the
 * release's digest is its signature, so it stands only where one does, and a line signed by a key the release does not
 * carry is refused.
 */
export function authorityOf(
  fields: Readonly<Record<string, string>>,
  signers: readonly Signer[],
  verify: Verify,
  published?: Published,
): SignerVerdict {
  const by = fields['by'] ?? '';
  if (published !== undefined && !fields['sig'] && by === 'target') {
    return published.pins.includes(published.digest) ? { kind: 'admitted', signer: by } : { kind: 'grey', why: `unpinned: no sources/ or uses/ line names ${published.digest}` };
  }
  if (published !== undefined && fields['sig'] && !signers.some((s) => s.id === by)) {
    return { kind: 'refuse', why: `REFUSE·authority ${by || '∅'} is no key this release carries`, named: by };
  }
  if (!fields['sig']) return { kind: 'grey', why: 'unsigned' };
  const signer = signers.find((s) => s.id === by);
  if (!signer) return { kind: 'grey', why: `signer ${by || '∅'} is not admitted` };
  if (!verify(fields, signer.publicKey)) return { kind: 'grey', why: `the signature does not hold for ${by}` };
  const epoch = epochOf(fields);
  const window = windowAt(signer, epoch);
  if (window.close !== null && epoch > window.close) {
    return { kind: 'refuse', why: `REFUSE·authority ${by} signed at epoch ${epoch}, after its epoch closed at ${window.close}`, named: by };
  }
  if (epoch < window.start) return { kind: 'grey', why: `signed at epoch ${epoch}, before ${by} was admitted at ${window.start}` };
  const scope = fields['scope'] ?? '';
  const covering = signer.spans === undefined ? signer.coverage : signer.spans.filter((span) => epoch >= span.from && (span.to === null || epoch < span.to)).flatMap((span) => span.globs);
  if (!covering.some((prefix) => prefix === '*' || under(prefix, scope))) {
    return { kind: 'refuse', why: `REFUSE·authority ${by} does not cover ${scope}`, named: by };
  }
  const depth = resolution(region(scope));
  if (depth < signer.depth.lo || depth > signer.depth.hi) {
    return { kind: 'refuse', why: `REFUSE·authority ${by} may not sign at depth ${depth}`, named: by };
  }
  if (within(region(scope), region(KEYS)) && signer.keyClass !== 'authorize') {
    return { kind: 'refuse', why: `REFUSE·authority ${by} is attest and cannot admit signers`, named: by };
  }
  return { kind: 'admitted', signer: by };
}

const COORDINATE_ROLES = ['source', 'derived', 'observed', 'foreign'] as const;
export type CoordinateRole = (typeof COORDINATE_ROLES)[number];

export interface RoleClaim {
  readonly name: string;
  readonly role: CoordinateRole;
}

const ROLE_PREFIXES = ['coordinate-role/', 'leaf-role/'] as const;
const OUTRANKS: readonly CoordinateRole[] = ['foreign', 'derived', 'observed'];

/** What a region's role makes of the paths it names: a source is written by hand, a render and a receipt by the fold. */
const REGIONED: ReadonlyMap<string, CoordinateRole> = new Map([['source', 'source'], ['render', 'derived'], ['receipt', 'derived']]);

export function roleClaimsOf(lines: readonly Readonly<Record<string, string>>[]): readonly RoleClaim[] {
  return lines.flatMap((f) => {
    const scope = f['scope'] ?? '';
    const role = f['value'] ?? '';
    const regioned = REGIONED.get(f['role'] ?? '');
    if (scope.startsWith('region/') && f['measure'] === 'paths' && regioned !== undefined && role !== 'withdraw') return role.split('|').filter(Boolean).map((name) => ({ name, role: regioned }));
    const prefix = ROLE_PREFIXES.find((one) => scope.startsWith(one));
    if (prefix === undefined || f['measure'] !== 'role' || !(COORDINATE_ROLES as readonly string[]).includes(role)) return [];
    return [{ name: scope.slice(prefix.length), role: role as CoordinateRole }];
  });
}

export function namesAt(at: string, name: string): boolean {
  return passes(region(at), name);
}

export function roleAt(at: string, claims: readonly RoleClaim[]): CoordinateRole {
  const place = { at: region(at).at, epoch: 0, seen: [] };
  return (outranks([place], claims.map((c) => [c.name, c.role] as const), OUTRANKS) as CoordinateRole | null) ?? 'source';
}
