import {providerFields} from '../topos/provider-inputs.ts';
/** It answers what a world answers — render, receipt, observe, run — what does a world owe? */
import { handed } from '../capsule/index.ts';
import type { Asked } from '../capsule/index.ts';
import { PROTOCOL } from '../wire/line.ts';
import { matches } from '../wire/classes.ts';
import type { Request, Response } from '../wire/spec.ts';

export type { Request, Response } from '../wire/spec.ts';

type Answering = {
  readonly observe?: (bytes: Uint8Array, place: string, region?: string, files?: readonly { readonly place: string; readonly text: string }[], context?: Asked) => readonly unknown[];
  readonly run?: (place: string, self: string, held: readonly (readonly [string, string])[], region: string | undefined, context?: Asked) => readonly unknown[];
  readonly render?: (asked: Asked) => readonly string[];
  readonly receipt?: (asked: Asked) => readonly unknown[];
};

/**
 * The one contract across processes, and the one serve: a module's one export answers each request, a reader's by
 * observing the file it is handed or, handed none, running the place it names, as the region asked when it holds several, a capsule's
 * by rendering a region, or by answering the claims of a receipt region, from the lines its own lock reads, parsed here and handed over. What throws is a refusal, what the module has no export for is an
 * abstention, and a reader that can only observe is refused when no file is handed: it never reads an empty one. The host reads and writes, this never does.
 */
export function answer(module: Answering, request: Request, self: string): Response {
  try {
    const asked = (): Asked => {
      const reads = request.reads ?? [];
      const regions = Object.fromEntries(Object.entries(request.regions ?? {}).filter(([name]) => reads.some((read) => matches(read, `region/${name}`)))
        .map(([name, held]) => [name, { lines: handed(['**'], held.lines), receipts: handed(['**'], held.receipts) }]));
      return { ...(request.provider===undefined?{}:{provider:providerFields(request.provider)}), region: request.region ?? '', at: request.at ?? 3, shape: request.shape ?? '', name: request.name ?? '', reads, lines: handed(reads, request.lines ?? []), regions };
    };
    if (request.verb === 'render' && module.render) return { protocol: PROTOCOL, kind: 'fact', lines: module.render(asked()) };
    if (request.verb === 'read' && module.receipt && request.reads !== undefined) return { protocol: PROTOCOL, kind: 'fact', claims: module.receipt(asked()) };
    const file = request.files[0];
    if (request.verb === 'read' && module.observe && file !== undefined) {
      return { protocol: PROTOCOL, kind: 'fact', claims: module.observe(new TextEncoder().encode(file.text), request.rootScope, request.region, request.files, asked()) };
    }
    if (request.verb === 'read' && module.run) return { protocol: PROTOCOL, kind: 'fact', claims: module.run(request.rootScope, self, request.held ?? [], request.region, asked()) };
    if (request.verb === 'read' && module.observe) return { protocol: PROTOCOL, kind: 'refuse', why: 'no file was handed to observe' };
    return { protocol: PROTOCOL, kind: 'abstain', why: `no export answers ${request.verb}` };
  } catch (thrown) {
    return { protocol: PROTOCOL, kind: 'refuse', why: String(thrown) };
  }
}

type Listening = { __boundRead?: (at: string) => void };

/**
 * Observation is the contract's, not a global's: a runner listens once, and a harness hands each sample it loaded through
 * `observed`, which notes every field of a case a block reads by where the case came from; nobody listening, nothing is noted.
 */
export const listen = (note: ((at: string) => void) | undefined): ((at: string) => void) | undefined => {
  const was = (globalThis as Listening).__boundRead;
  (globalThis as Listening).__boundRead = note;
  return was;
};

export const observed = <T extends Readonly<Record<string, unknown>>>(held: T, at: string): T => {
  const note = (globalThis as Listening).__boundRead;
  if (note === undefined || !Array.isArray(held['cases'])) return held;
  const cases = (held['cases'] as object[]).map((one, i) => new Proxy(one, {
    get: (target, field, receiver) => {
      if (typeof field === 'string') note(`${at}#${i}:${field}`);
      return Reflect.get(target, field, receiver);
    },
  }));
  return { ...held, cases };
};

export const respond = (module: Answering, input: string, self: string): string =>
  JSON.stringify((JSON.parse(input) as readonly Request[]).map((request) => answer(module, request, self)));

export function responsesOf(printed: string, asked: number): readonly Response[] {
  const last = /(?:^|\n)([^\n]*)$/.exec(printed.trimEnd())?.[1] ?? '';
  const held = last.startsWith('[') ? (JSON.parse(last) as readonly Response[]) : [];
  return Array.from({ length: asked }, (_, i) => held[i] ?? { protocol: PROTOCOL, kind: 'refuse', why: 'no answer' });
}
