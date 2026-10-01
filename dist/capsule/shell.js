import { matches } from "../wire/classes.js";
import { atResolution, steps } from "../wire/grammar.js";
/**
 * The shell a capsule's rendered index hands its regions to: a region is answered only when it was handed every read
 * its own line declares, and one handed less is refused — the no every render capsule carries without writing it.
 * Handed the url of a world's index instead, each shell only names where the world lies: its host reads the own lock
 * beside it once and loads each region by name and role.
 */
export function shell(regions) {
    return typeof regions === 'string' ? located(regions) : dispatch(regions, 'renders');
}
const dispatch = (regions, verb) => (asked) => {
    const one = regions[asked.region];
    if (one === undefined)
        throw new Error(`REFUSE·region ${asked.region}: no line of this capsule ${verb} it`);
    const short = one.reads.filter((read) => !asked.reads.includes(read));
    if (short.length)
        throw new Error(`REFUSE·region ${asked.region}: handed less than it declares, without ${short.join(' · ')}`);
    return one.region(asked);
};
const located = (url) => Object.assign(() => { throw new Error(`REFUSE·world ${url}: its host answers it by the regions its own lock names`); }, { world: url });
const fits = (read, place) => {
    const glob = atResolution(read).name;
    const [bare, tail] = place.endsWith('/') ? [place.slice(0, -1), '/'] : [place, ''];
    const held = steps(bare);
    return held.some((_, i) => matches(glob, `${steps(held.slice(i))}${tail}`));
};
/**
 * The shell a reader capsule's rendered index hands its readers to: each is asked as the region its own line names, and
 * reads only what that line declares it reads — a region fits a read when some tail of its steps matches the read's glob,
 * and what follows its `@` is the resolution it is handed at. A region no line names is refused, and so is a file of another shape.
 */
export function readers(regions) {
    if (typeof regions === 'string')
        return { observe: located(regions), run: located(regions) };
    const one = (region, places) => {
        const held = region === undefined ? undefined : regions[region];
        if (held === undefined)
            throw new Error(`REFUSE·region ${region ?? ''}: no line of this capsule reads with it`);
        const outside = places.filter((place) => !held.reads.some((read) => fits(read, place)));
        if (outside.length)
            throw new Error(`REFUSE·region ${region}: ${outside.join(' · ')} is none of ${held.reads.join(' · ')}`);
        return held;
    };
    return {
        observe: (bytes, place, region, files = []) => ((held) => (held.observe ? held.observe(bytes, place, files) : []))(one(region, files.length ? files.map((file) => file.place) : [place])),
        run: (place, self, held, region) => ((reading) => {
            if (!reading.run)
                throw new Error(`REFUSE·region ${region ?? ''}: it reads the files it is handed, and none was handed`);
            return reading.run(place, self, held);
        })(one(region, [place])),
    };
}
export const counted = (asked, what, n, measure) => [{ scope: `${asked.region}/${what}`, measure, role: 'reads', bound: { kind: 'interval', lo: n, hi: n } }];
/**
 * The shell a capsule's rendered index hands its receipt regions to: a region answers claims, and only when it was
 * handed every read its own line declares; one handed less is refused, as a render is. A reading it answers is `counted`:
 * a count, named by the region that read it and by what it counted.
 */
export function receiptShell(regions) {
    return typeof regions === 'string' ? located(regions) : dispatch(regions, 'answers');
}
