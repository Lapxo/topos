/**
 * The wire reads itself: a claim is read by the lock of the wire that stood when it was signed. Its fields, their
 * alphabets and forms, and the algorithms its digests and signatures name, are lines of that lock with an epoch —
 * never a grammar compiled here and never a file this reads. What stays compiled is the line and the forms of the
 * algebra; every name the wire admits arrives as a claim. The fields that say who signed and when, its envelope, never
 * make two claims different claims.
 */
import { intervals } from '@lapxo/obligations';
import { parse as parseLine } from "./line.js";
import { abstain, fact, refuse } from "./outcome.js";
import { unpipe, boundOf, REF_RELATIONS, BOUND_FORMS } from "./values.js";
import { outranks, passes, region, resolution, within } from '@lapxo/obligations/field';
import { parseSignature } from "./sig.js";
import { under } from "../authority/admit.js";
export const ENVELOPE = new Set(['sig', 'expires', 'repo', 'by', 'epoch']);
const WITHDRAW = 'withdraw';
const LOCK = 'audit/wire/';
export function isWireClaim(fields) {
    return (fields['scope'] ?? '').startsWith(LOCK);
}
function epochOf(fields) {
    const value = fields['epoch'] ?? '';
    return /^\d+$/.test(value) ? Number(value) : 0;
}
function names(withdraw, line) {
    return Object.keys(withdraw).filter((k) => k !== 'value' && !ENVELOPE.has(k)).every((k) => line[k] === withdraw[k]);
}
export function wireAt(lines, epoch) {
    const mine = lines.filter((f) => (f['scope'] ?? '').startsWith(LOCK) && epochOf(f) <= epoch);
    const withdrawals = mine.filter((f) => f['value'] === WITHDRAW);
    const standing = new Map();
    for (const f of mine) {
        if (f['value'] === WITHDRAW || withdrawals.some((w) => names(w, f)))
            continue;
        const held = standing.get(f['scope'] ?? '');
        if (!held || epochOf(f) >= epochOf(held))
            standing.set(f['scope'] ?? '', f);
    }
    if (!standing.size)
        return null;
    const ids = (name) => new Set((standing.get(`${LOCK}${name}`)?.['value'] ?? '').split('|').filter(Boolean));
    const formOf = new Map([...standing]
        .filter(([scope]) => scope.startsWith(`${LOCK}form/`))
        .map(([scope, f]) => [scope.slice(`${LOCK}form/`.length), f['value'] ?? '']));
    const lists = new Map([...standing.keys()]
        .map((scope) => scope.slice(LOCK.length))
        .filter((name) => !name.includes('/'))
        .map((name) => [name, ids(name)]));
    return {
        epoch,
        fields: ids('fields'),
        required: ids('required'),
        roles: ids('roles'),
        forms: ids('forms'),
        classes: ids('at-classes'),
        digests: new Set([...ids('digest-algorithms')].map((one) => one.split(':')[0])),
        signatures: ids('signature-algorithms'),
        formOf,
        lists,
    };
}
function admittedDigest(value, wire) {
    const colon = value.indexOf(':');
    return colon > 0 && wire.digests.has(value.slice(0, colon)) && /^[0-9a-f]+$/i.test(value.slice(colon + 1));
}
function isRegion(need) {
    if (need.startsWith('/') || /[\s\\]/.test(need))
        return false;
    const steps = need.split('/').filter((step) => step !== '');
    return steps.length > 0 && steps.every((step, i) => step !== '.' && step !== '..' && (!step.includes('*') || i === steps.length - 1));
}
const FIELD_FORMS = {
    region: (value) => value.split('|').filter(Boolean).every(isRegion),
    class: (value, wire) => {
        const colon = value.indexOf(':');
        if (colon <= 0 || !wire.classes.has(value.slice(0, colon)))
            return false;
        const rest = value.slice(colon + 1);
        return !/^[a-z0-9-]+:[0-9a-f]{16,}$/i.test(rest) || admittedDigest(rest, wire);
    },
    signature: (value, wire) => {
        const got = parseSignature(value);
        if (got === null || !wire.signatures.has(got.algorithm))
            return false;
        const era = got.algorithm.slice(got.algorithm.lastIndexOf(':') + 1);
        return admittedDigest(got.algorithm, wire) || (got.algorithm.includes(':') && (wire.lists.get('era')?.has(era) ?? false));
    },
    count: (value) => /^\d+$/.test(value),
};
function debit(field, why) {
    return refuse(why, field);
}
export function fromLine(text, wire, grammars) {
    const line = parseLine(text);
    if (line.kind !== 'fact') {
        return line.kind === 'abstain' ? abstain(line.why) : refuse(line.why, line.named);
    }
    const f = line.value.fields;
    if (wire) {
        for (const k of Object.keys(f))
            if (!wire.fields.has(k))
                return debit(k, `\`${k}=\` is not a field of the wire at epoch ${wire.epoch}`);
        for (const k of wire.required)
            if (f[k] === undefined)
                return debit(k, `a claim with no \`${k}\``);
        for (const [k, form] of wire.formOf) {
            const v = f[k];
            if (v === undefined)
                continue;
            const ids = wire.lists.get(form);
            const reads = FIELD_FORMS[form] ?? (ids ? (value) => ids.has(value) : undefined);
            if (!reads)
                return abstain(`\`${k}\` takes the form ${form}, which this reader does not know`);
            if (!reads(v, wire))
                return debit(k, `\`${k}=${v}\` is not a ${form} of the wire at epoch ${wire.epoch}`);
        }
        if (f.role !== undefined && !wire.roles.has(f.role))
            return abstain(`\`role=${f.role}\` is a role this wire does not name`);
        if (!wire.forms.has(f.form ?? ''))
            return abstain(`\`form=${f.form}\` is a form this wire does not name`);
    }
    const listed = Array.isArray(grammars) ? grammars : undefined;
    const bound = f.value === WITHDRAW ? { kind: 'enumerated', values: [WITHDRAW] } : boundOf(f.form ?? '', f.value ?? '', listed);
    if (bound === null) {
        const mine = BOUND_FORMS.includes(f.form ?? '') || (listed?.some((g) => g.form === f.form) ?? false);
        return mine
            ? debit('value', `\`${f.value}\` is not a ${f.form}`)
            : abstain(`\`form=${f.form}\` is a form this reader does not know`);
    }
    const role = f.role === 'writes' ? 'writes' : f.role === 'demands' ? 'demands' : 'reads';
    const extra = {};
    for (const [k, v] of Object.entries(f)) {
        if (['scope', 'measure', 'form', 'value', 'by', 'at', 'role', 'unit', 'multiplicity', 'epoch', 'ref', 'to', 'ref_by'].includes(k))
            continue;
        extra[k] = v;
    }
    const rel = f.ref;
    const to = f.to === undefined ? null : unpipe(f.to);
    const reference = rel && to && REF_RELATIONS.includes(rel)
        ? { rel, to, by: f.ref_by === 'declared' ? 'declared' : 'inferred' }
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
    });
}
const KEYS = 'keys';
export function isKeyClaim(fields) {
    const scope = fields['scope'] ?? '';
    return scope === KEYS || scope.startsWith(`${KEYS}/`);
}
function depthWindow(value) {
    const m = /^(\d+)\.\.(\d+)$/.exec(value);
    return m ? { lo: Number(m[1]), hi: Number(m[2]) } : null;
}
const EPOCHS = intervals(-Infinity, Infinity);
const QUORUMS = intervals(1, Infinity);
function windowOf(signer) {
    return signer.epoch ?? { start: 0, close: null };
}
export function windowAt(signer, epoch) {
    const now = windowOf(signer);
    const standing = (signer.windows ?? []).filter((w) => epoch >= w.from && (w.to === null || epoch < w.to));
    return standing.length ? { start: now.start, close: standing.reduce((held, w) => EPOCHS.meet(held, w), EPOCHS.top).hi } : now;
}
function inside(signer, epoch) {
    const w = windowAt(signer, epoch);
    return epoch >= w.start && (w.close === null || epoch <= w.close);
}
function standsUntil(said) {
    const claim = (f) => [f['role'], f['form'], f['at']].join(' ');
    const withdrawn = new Map();
    for (const f of said)
        if (f['value'] === 'withdraw')
            withdrawn.set(claim(f), EPOCHS.meet(withdrawn.get(claim(f)) ?? EPOCHS.top, { lo: -Infinity, hi: epochOf(f) }));
    return (f) => withdrawn.get(claim(f))?.hi ?? null;
}
/**
 * What a key covers, and when it may sign, line by line: each coverage or epoch line stands from the epoch it was signed
 * at until a withdraw of the same claim, named by its at, lands; what it allowed before stays allowed for what was signed
 * then, and nothing signed after is allowed by it. Windows standing together close at the nearer, so only a withdraw
 * widens, and never for a line signed before it. A withdrawn line is never counted again.
 */
function coverageOver(said) {
    const until = standsUntil(said);
    const spans = said.filter((f) => f['value'] !== 'withdraw').map((f) => ({ globs: (f['value'] ?? '').split('|').filter(Boolean), from: epochOf(f), to: until(f) }))
        .filter((span) => span.to === null || span.from < span.to);
    return { coverage: [...new Set(spans.filter((span) => span.to === null).flatMap((span) => span.globs))], spans };
}
function windowsOver(said) {
    const until = standsUntil(said);
    return said.filter((f) => f['value'] !== 'withdraw').flatMap((f) => ((w) => (w === null ? [] : [{ ...w, from: epochOf(f), to: until(f) }]))(depthWindow(f['value'] ?? '')))
        .filter((w) => w.to === null || w.from < w.to);
}
export function signersOf(lines, root, verify) {
    const quorumLines = lines
        .filter((f) => f['scope'] === KEYS && f['measure'] === 'quorum' && f['by'] === root.id && verify(f, root.publicKey))
        .sort((a, b) => epochOf(a) - epochOf(b));
    const quorumAt = (epoch) => {
        const standing = quorumLines.filter((f) => epochOf(f) <= epoch).pop();
        return QUORUMS.meet(QUORUMS.top, depthWindow(standing?.['value'] ?? '') ?? QUORUMS.top).lo;
    };
    const ids = [...new Set(lines
            .map((f) => f['scope'] ?? '')
            .filter((scope) => scope.startsWith(`${KEYS}/`))
            .map((scope) => scope.slice(KEYS.length + 1)))];
    const closedAt = (signer, closes) => {
        const close = closes.get(signer.id);
        return close === undefined ? signer : { ...signer, epoch: { start: windowOf(signer).start, close } };
    };
    const claimsOn = (admitted, id, measure) => lines.filter((f) => {
        const admitter = admitted.get(f['by'] ?? '');
        return f['scope'] === `${KEYS}/${id}` && f['measure'] === measure && admitter !== undefined
            && admitter.keyClass === 'authorize' && inside(admitter, epochOf(f)) && verify(f, admitter.publicKey);
    });
    const admitUnder = (closes) => {
        const admitted = new Map([[root.id, closedAt(root, closes)]]);
        for (let grew = true; grew;) {
            grew = false;
            for (const id of ids) {
                if (admitted.has(id))
                    continue;
                const classLines = claimsOn(admitted, id, 'class');
                const withdrawn = new Set(classLines.filter((f) => f['value'] === 'withdraw').map((f) => f['by'] ?? ''));
                const counted = classLines
                    .filter((f) => f['value'] !== 'withdraw' && !withdrawn.has(f['by'] ?? ''))
                    .sort((a, b) => epochOf(a) - epochOf(b));
                const admitters = [];
                let start = null;
                for (const f of counted) {
                    const by = f['by'] ?? '';
                    if (!admitters.includes(by))
                        admitters.push(by);
                    if (admitters.length >= quorumAt(epochOf(f))) {
                        start = epochOf(f);
                        break;
                    }
                }
                const publicKey = claimsOn(admitted, id, 'public-key')[0]?.['value'] ?? '';
                if (start === null || !publicKey)
                    continue;
                admitted.set(id, closedAt({
                    id,
                    keyClass: counted.every((f) => f['value'] === 'authorize') ? 'authorize' : 'attest',
                    publicKey,
                    ...coverageOver(claimsOn(admitted, id, 'coverage')),
                    windows: windowsOver(claimsOn(admitted, id, 'epoch')),
                    depth: depthWindow(claimsOn(admitted, id, 'resolution')[0]?.['value'] ?? '') ?? { lo: 1, hi: 1 },
                    admittedBy: admitters,
                    epoch: { start, close: null },
                }, closes));
                grew = true;
            }
        }
        return admitted;
    };
    let closes = new Map();
    for (let round = 0; round <= ids.length + 1; round++) {
        const admitted = admitUnder(closes);
        const next = new Map();
        for (const id of admitted.keys()) {
            const standing = windowsOver(claimsOn(admitted, id, 'epoch')).filter((w) => w.to === null);
            if (standing.length)
                next.set(id, standing.reduce((held, w) => EPOCHS.meet(held, w), EPOCHS.top).hi);
        }
        const moved = next.size !== closes.size || [...next].some(([id, close]) => closes.get(id) !== close);
        if (!moved)
            return { admitted: [...admitted.values()], potential: ids.filter((id) => !admitted.has(id)) };
        closes = next;
    }
    const admitted = admitUnder(closes);
    return { admitted: [...admitted.values()], potential: ids.filter((id) => !admitted.has(id)) };
}
export function authorityOf(fields, signers, verify) {
    const by = fields['by'] ?? '';
    if (!fields['sig'])
        return { kind: 'grey', why: 'unsigned' };
    const signer = signers.find((s) => s.id === by);
    if (!signer)
        return { kind: 'grey', why: `signer ${by || '∅'} is not admitted` };
    if (!verify(fields, signer.publicKey))
        return { kind: 'grey', why: `the signature does not hold for ${by}` };
    const epoch = epochOf(fields);
    const window = windowAt(signer, epoch);
    if (window.close !== null && epoch > window.close) {
        return { kind: 'refuse', why: `REFUSE·authority ${by} signed at epoch ${epoch}, after its epoch closed at ${window.close}`, named: by };
    }
    if (epoch < window.start)
        return { kind: 'grey', why: `signed at epoch ${epoch}, before ${by} was admitted at ${window.start}` };
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
const COORDINATE_ROLES = ['source', 'derived', 'observed', 'foreign'];
const ROLE_PREFIXES = ['coordinate-role/', 'leaf-role/'];
const OUTRANKS = ['foreign', 'derived', 'observed'];
/** What a region's role makes of the paths it names: a source is written by hand, a render and a receipt by the fold. */
const REGIONED = new Map([['source', 'source'], ['render', 'derived'], ['receipt', 'derived']]);
export function roleClaimsOf(lines) {
    return lines.flatMap((f) => {
        const scope = f['scope'] ?? '';
        const role = f['value'] ?? '';
        const regioned = REGIONED.get(f['role'] ?? '');
        if (scope.startsWith('region/') && f['measure'] === 'paths' && regioned !== undefined && role !== 'withdraw')
            return role.split('|').filter(Boolean).map((name) => ({ name, role: regioned }));
        const prefix = ROLE_PREFIXES.find((one) => scope.startsWith(one));
        if (prefix === undefined || f['measure'] !== 'role' || !COORDINATE_ROLES.includes(role))
            return [];
        return [{ name: scope.slice(prefix.length), role: role }];
    });
}
export function namesAt(at, name) {
    return passes(region(at), name);
}
export function roleAt(at, claims) {
    const place = { at: region(at).at, epoch: 0, seen: [] };
    return outranks([place], claims.map((c) => [c.name, c.role]), OUTRANKS) ?? 'source';
}
