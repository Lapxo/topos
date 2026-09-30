import type { Bound, MeetSemilattice } from './types.ts';

export type Kind = 'claims' | 'forms' | 'readers' | 'views';

export interface FormBody<T> {
  lattice(): MeetSemilattice<T>;
  readonly helly: boolean;
}

export interface FileInput {
  readonly place: string;
  readonly text: string;
}

export type ReaderMethod = 'exact' | 'statistics';
export type ReaderInputKind = "bytes" | "session" | "execution" | "stream";

export interface ViewBody<T> {
  to(bound: Bound): T;
  from(shown: T): Bound | null;
}

function matchStar(pat: string, seg: string): boolean {
  if (!pat.includes('*')) return pat === seg;
  const bits = pat.split('*');
  if (!seg.startsWith(bits[0]!)) return false;
  let i = bits[0]!.length;
  for (let b = 1; b < bits.length; b++) {
    const bit = bits[b]!;
    if (bit === '') return b === bits.length - 1 || matchStar(bits.slice(b).join('*'), seg.slice(i));
    const hit = seg.indexOf(bit, i);
    if (hit < 0) return false;
    i = hit + bit.length;
  }
  return i === seg.length || pat.endsWith('*');
}

function matchParts(g: readonly string[], gi: number, p: readonly string[], pi: number): boolean {
  if (gi === g.length) return pi === p.length;
  if (g[gi] === '**') {
    if (gi + 1 === g.length) return true;
    for (let k = pi; k <= p.length; k++) {
      if (matchParts(g, gi + 1, p, k)) return true;
    }
    return false;
  }
  if (pi === p.length) return false;
  if (!matchStar(g[gi]!, p[pi]!)) return false;
  return matchParts(g, gi + 1, p, pi + 1);
}

export function matches(glob: string, place: string): boolean {
  return matchParts(glob.split('/'), 0, place.split('/'), 0);
}
