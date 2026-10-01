/**
 * The inert capsule. Four classes, hash edges, no functions.
 */
import type { ScaleDescriptor } from '../classes/scale.ts';
import type { ReaderInputKind, ReaderMethod } from './classes.ts';
import type { Claim } from './types.ts';

interface ReaderDescriptor {
  readonly id: string;
  readonly handles: { readonly format: string; readonly version?: string };
  readonly method: ReaderMethod;
  readonly input: { readonly kind: ReaderInputKind };
  readonly needs: readonly string[];
  readonly units: readonly string[];
  readonly implementation: string;
  readonly sample: {
    readonly yes: readonly { readonly place: string; readonly text: string }[];
    readonly no: readonly { readonly place: string; readonly text: string }[];
  };
}

interface ViewDescriptor {
  readonly id: string;
  readonly measures: readonly string[];
  readonly mode: 'lossless' | 'projection';
}

export interface ToposDescriptor {
  readonly id: string;
  readonly includes: readonly string[];
  readonly claims: readonly Claim[];
  readonly forms: readonly ScaleDescriptor[];
  readonly readers: readonly ReaderDescriptor[];
  readonly views: readonly ViewDescriptor[];
}

export const emptyDescriptor = (id: string): ToposDescriptor => ({
  id,
  includes: [],
  claims: [],
  forms: [],
  readers: [],
  views: [],
});
