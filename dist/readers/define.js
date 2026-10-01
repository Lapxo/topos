/**
 * A topos as a container. It lowers to an inert descriptor; it does not invent
 * a fifth class or a universal composition law.
 */
import { intervals } from '@lapxo/obligations';
import { claim } from "../wire/claim.js";
import { emptyDescriptor } from "../wire/descriptor.js";
const asClaim = (draft) => {
    const judged = claim(draft);
    if (judged.kind !== 'fact') {
        throw new Error(judged.why);
    }
    return judged.value;
};
const SPANS = intervals(-Infinity, Infinity);
/** A region's cost is a fold of what was observed: the join of the spans its runs took, and none while it is only declared. */
export const costOf = (observed) => ((held) => (SPANS.inhabited(held) ? { cost: [held.lo, held.hi] } : {}))(observed.reduce((all, [lo, hi]) => SPANS.join(all, { lo, hi }), SPANS.bottom));
export function defineTopos(opts) {
    const by = opts.by ?? opts.id;
    const includes = opts.includes ?? [];
    const members = opts.members ?? [];
    const claims = opts.observe
        ? []
        : [
            asClaim({
                scope: `topos/${opts.id}/class`,
                measure: 'kind',
                role: 'reads',
                by,
                at: opts.id,
                bound: { kind: 'enumerated', values: ['readers'] },
            }),
            ...includes.map((ref) => asClaim({
                scope: `topos/${opts.id}/includes`,
                measure: 'id',
                role: 'reads',
                by,
                at: opts.id,
                bound: { kind: 'enumerated', values: [ref] },
                reference: { rel: 'within', to: [`topos/${ref}`], by: 'declared' },
            })),
        ];
    const descriptor = {
        ...emptyDescriptor(opts.id),
        includes,
        claims,
    };
    return {
        kind: 'defined',
        id: opts.id,
        includes,
        members,
        claims,
        descriptor,
        bindings: opts.bindings ?? {},
        ...(opts.domain ? { domain: opts.domain } : {}),
        ...(opts.observe ? { observe: opts.observe } : {}),
    };
}
