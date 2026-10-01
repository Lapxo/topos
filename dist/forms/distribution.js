import { latticeForm } from '@lapxo/obligations';
import { alphabet } from "../wire/grammar.js";
import { levelsOf, refuseForm, wordsAt, written } from "./form.js";
/** A distribution is a product of levels by bucket: every tuple of one level per bucket, ordered bucket by bucket. */
function product(params) {
    const buckets = wordsAt('distribution', params, 'buckets');
    const levels = wordsAt('distribution', params, 'levels');
    const tuples = buckets.reduce((held) => held.flatMap((tuple) => levels.map((level) => [...tuple, level])), [[]]);
    return { buckets, levels, tuples };
}
const orderOver = (params) => {
    const { levels, tuples } = product(params);
    const at = (tuple) => tuple.map((level) => levels.findIndex((one) => one === level));
    return { levels: tuples.map((tuple) => JSON.stringify(tuple)), leq: tuples.map((low) => tuples.map((high) => at(low).every((rank, i) => rank <= (at(high)[i] ?? -1)))) };
};
export const distributionForm = {
    id: 'distribution',
    lattice: (params) => latticeForm.lattice(orderOver(params)),
    parse(params, text) {
        const { buckets, levels } = product(params);
        const bucketOf = (part) => buckets.find((bucket) => !bucket.includes(':') && part.startsWith(`${bucket}:`));
        const members = alphabet(text).members;
        const said = new Map(members.flatMap((part) => ((bucket) => (bucket === undefined ? [] : [[bucket, part.slice(bucket.length + 1)]]))(bucketOf(part))));
        const stray = members.find((part) => bucketOf(part) === undefined) ?? buckets.find((bucket) => !said.has(bucket));
        if (stray !== undefined)
            refuseForm('distribution', `\`${stray}\` is not the bucket list it is given, every bucket named once`);
        const bands = buckets.map((bucket) => levelsOf('distribution', levels, said.get(bucket) ?? ''));
        return { subject: '', floor: JSON.stringify(bands.map((band) => band.floor)), ceiling: JSON.stringify(bands.map((band) => band.ceiling)) };
    },
    emit(params, value) {
        const [lows, highs] = [JSON.parse(value.floor), JSON.parse(value.ceiling)];
        return written(product(params).buckets.map((bucket, i) => (lows[i] === highs[i] ? `${bucket}:${lows[i]}` : `${bucket}:${lows[i]}..${highs[i]}`)));
    },
    show: (params, value) => latticeForm.lattice(orderOver(params)).show(value),
    points: (params, seed, n) => latticeForm.points(orderOver(params), seed, n),
};
