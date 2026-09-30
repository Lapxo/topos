import { ladderForm } from '@lapxo/obligations';
import type { Unit } from '@lapxo/obligations';
import { levelsOf, wordsAt } from './form.ts';
import type { WireForm } from './form.ts';

const over = (params: unknown): { readonly levels: readonly string[] } => ({ levels: wordsAt('ladder', params, 'levels') });

export const ladderOfForm: WireForm<Unit> = {
  id: 'ladder',
  lattice: (params) => ladderForm.lattice(over(params)),
  parse: (params, text) => levelsOf('ladder', over(params).levels, text),
  emit: (_params, value) => (value.floor === value.ceiling ? value.floor : `${value.floor}..${value.ceiling}`),
  show: (params, value) => ladderForm.lattice(over(params)).show(value),
  points: (params, seed, n) => ladderForm.points(over(params), seed, n),
};
