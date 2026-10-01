import { matches } from "../wire/classes.js";
import { alphabet } from "../wire/grammar.js";
import { parse } from "../wire/line.js";
const standing = (lines) => lines.flatMap((line) => {
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
export function declarationOf(lines) {
    const held = standing(lines);
    const said = (scope) => held.filter((fields) => fields['scope'] === scope)
        .flatMap((fields) => alphabet(fields['value'] ?? '').members);
    const own = held.filter((fields) => (fields['scope'] ?? '').startsWith('region/') && fields['measure'] === 'reads');
    const named = (fields, prefix) => (fields['scope'] ?? '').slice(prefix.length);
    const reading = (scope) => own.filter((fields) => fields['scope'] === scope).flatMap((fields) => alphabet(fields['value'] ?? '').members);
    const regions = Object.fromEntries(own.length ? own.map((fields) => [named(fields, 'region/'), reading(fields['scope'] ?? '')])
        : held.filter((fields) => (fields['scope'] ?? '').startsWith('capsule/reads/')).map((fields) => [named(fields, 'capsule/reads/'), said(fields['scope'] ?? '')]));
    const [runtime, holds] = [said('capsule/runtime')[0], said('capsule/holds')[0]];
    return {
        domain: said('capsule/domain')[0] ?? '',
        ...(runtime === undefined ? {} : { runtime }),
        ...(holds === undefined ? {} : { holds }),
        pins: Object.fromEntries(held.filter((fields) => (fields['scope'] ?? '').startsWith('capsule/') && fields['measure'] === 'digest')
            .map((fields) => [named(fields, 'capsule/'), fields['value'] ?? ''])),
        renders: own.length ? own.filter((fields) => fields['role'] === 'render').map((fields) => named(fields, 'region/')) : said('capsule/regions'),
        reads: [...new Set([...said('capsule/reads'), ...Object.values(regions).flat()])],
        regions,
        writes: Object.fromEntries(own.map((fields) => [named(fields, 'region/'), fields['role'] ?? ''])),
        effects: said('capsule/effects'),
    };
}
export const readsOf = (declaration, region) => (Object.keys(declaration.regions).length ? declaration.regions[region] : declaration.reads);
/**
 * The lines a capsule sees, handed by the contract: the standing lines of the place that lie in a region its own lock
 * reads, parsed by the wire. Nothing else of the lock reaches it, and no file does.
 */
export function handed(reads, lines) {
    return standing(lines).filter((fields) => reads.some((region) => matches(region, fields['scope'] ?? '')));
}
