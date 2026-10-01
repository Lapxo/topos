import { latticeForm } from '@lapxo/obligations';
import type { Unit } from '@lapxo/obligations';
import { levelsOf, paramsOf, refuseForm, wordsAt } from './form.ts';
import type { WireForm } from './form.ts';

/** An order a line names outright: its levels and, for each pair, whether the first lies under the second. */
function orderOf(params: unknown): { readonly levels: readonly string[]; readonly leq: readonly (readonly boolean[])[] } {
  const levels = wordsAt('lattice', params, 'levels');
  const leq = paramsOf(params)['leq'];
  if (!Array.isArray(leq) || leq.length !== levels.length || leq.some((row) => !Array.isArray(row) || row.length !== levels.length)) refuseForm('lattice', 'takes leq as a square of truths over its levels');
  return { levels, leq: leq as readonly (readonly boolean[])[] };
}

export const latticeOfForm: WireForm<Unit> = {
  id: 'lattice',
  lattice: (params) => latticeForm.lattice(orderOf(params)),
  parse: (params, text) => levelsOf('lattice', orderOf(params).levels, text),
  emit: (_params, value) => (value.floor === value.ceiling ? value.floor : `${value.floor}..${value.ceiling}`),
  show: (params, value) => latticeForm.lattice(orderOf(params)).show(value),
  points: (params, seed, n) => latticeForm.points(orderOf(params), seed, n),
};
