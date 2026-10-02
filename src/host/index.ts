import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Handed } from '../capsule/asked.ts';
import { readers, receiptShell, shell } from '../capsule/shell.ts';
import { alphabet } from '../wire/grammar.ts';

type Module = Readonly<Record<string, unknown>>;

/**
 * A located index names only where its world lies, so its host loads the world in its place: handed the world's own lock
 * parsed and folded, as it stands, it imports each region from its one file by name and role into the shell of its kind,
 * a render's `render`, a law's `receipt`, a reader's `observe` and `run`, a region with a line of what it writes being a
 * reader. A world with no region of a kind has no shell of it; an index that still hands its regions to its shells is
 * answered as it is.
 */
export async function locate(entry: string, lock: readonly Handed[], regions: string, ext: string): Promise<Module> {
  const index = await import(pathToFileURL(entry).href) as Module;
  if (!Object.values(index).some((one) => typeof (one as { world?: unknown } | undefined)?.world === 'string')) return index;
  const standing = lock.filter((fields) => fields['value'] !== 'withdraw' && (fields['scope'] ?? '').startsWith('region/'));
  const named = (fields: Handed): string => (fields['scope'] ?? '').slice('region/'.length);
  const reader = new Set(standing.filter((fields) => fields['measure'] === 'writes').map(named));
  const declared = standing.filter((fields) => fields['measure'] === 'reads');
  const loaded = async (role: string, pick: (module: Module) => Record<string, unknown>) => ((held) => (held.length ? Object.fromEntries(held) : undefined))(await Promise.all(declared
    .filter((fields) => (reader.has(named(fields)) ? 'reader' : fields['role'] ?? '') === role)
    .map(async (fields) => [named(fields), { reads: alphabet(fields['value'] ?? '').members, ...pick(await import(pathToFileURL(join(regions, `${named(fields)}${ext}`)).href) as Module) }] as const)));
  const [render, receipt, reading] = await Promise.all([loaded('render', (one) => ({ region: one['render'] })), loaded('receipt', (one) => ({ region: one['receipt'] })), loaded('reader', (one) => ({ observe: one['observe'], run: one['run'] }))]);
  return { render: render && shell(render as never), receipt: receipt && receiptShell(receipt as never), ...(reading ? readers(reading as never) : {}) };
}
