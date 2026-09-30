import { continuousForm } from '@lapxo/obligations';
import type { Interval } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from './form.ts';
import type { WireForm } from './form.ts';

const span = (params: unknown): Interval => ({ lo: numberAt('phase', params, 'lo'), hi: numberAt('phase', params, 'hi') });

export const phaseForm: WireForm<Interval> = {
  id: 'phase',
  lattice: (params) => continuousForm.lattice(span(params)),
  parse: (params, text) => bandOf('phase', span(params), text),
  emit: (_params, value) => bandText(value),
  show: (params, value) => continuousForm.lattice(span(params)).show(value),
  points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
