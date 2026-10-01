import { continuousForm } from '@lapxo/obligations';
import type { Interval } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from './form.ts';
import type { WireForm } from './form.ts';

const span = (params: unknown): Interval => ({ lo: 0, hi: numberAt('rank', params, 'n') });

export const rankForm: WireForm<Interval> = {
  id: 'rank',
  lattice: (params) => continuousForm.lattice(span(params)),
  parse: (params, text) => bandOf('rank', span(params), text),
  emit: (_params, value) => bandText(value),
  show: (params, value) => continuousForm.lattice(span(params)).show(value),
  points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
