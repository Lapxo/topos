var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readers, receiptShell, shell } from "../capsule/shell.js";
import { alphabet } from "../wire/grammar.js";
/**
 * A located index names only where its world lies, so its host loads the world in its place: handed the world's own lock
 * parsed and folded, as it stands, it imports each region from its one file by name and role into the shell of its kind,
 * a render's `render`, a law's `receipt`, a reader's `observe` and `run`, a region with a line of what it writes being a
 * reader. A world with no region of a kind has no shell of it; an index that still hands its regions to its shells is
 * answered as it is.
 */
export async function locate(entry, lock, regions, ext) {
    const index = await import(__rewriteRelativeImportExtension(pathToFileURL(entry).href));
    if (!Object.values(index).some((one) => typeof one?.world === 'string'))
        return index;
    const standing = lock.filter((fields) => fields['value'] !== 'withdraw' && (fields['scope'] ?? '').startsWith('region/'));
    const named = (fields) => (fields['scope'] ?? '').slice('region/'.length);
    const reader = new Set(standing.filter((fields) => fields['measure'] === 'writes').map(named));
    const declared = standing.filter((fields) => fields['measure'] === 'reads');
    const loaded = async (role, pick) => ((held) => (held.length ? Object.fromEntries(held) : undefined))(await Promise.all(declared
        .filter((fields) => (reader.has(named(fields)) ? 'reader' : fields['role'] ?? '') === role)
        .map(async (fields) => [named(fields), { reads: alphabet(fields['value'] ?? '').members, ...pick(await import(__rewriteRelativeImportExtension(pathToFileURL(join(regions, `${named(fields)}${ext}`)).href))) }])));
    const [render, receipt, reading] = await Promise.all([loaded('render', (one) => ({ region: one['render'] })), loaded('receipt', (one) => ({ region: one['receipt'] })), loaded('reader', (one) => ({ observe: one['observe'], run: one['run'] }))]);
    return { render: render && shell(render), receipt: receipt && receiptShell(receipt), ...(reading ? readers(reading) : {}) };
}
