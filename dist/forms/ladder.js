import { ladderForm } from '@lapxo/obligations';
import { levelsOf, wordsAt } from "./form.js";
const over = (params) => ({ levels: wordsAt('ladder', params, 'levels') });
export const ladderOfForm = {
    id: 'ladder',
    lattice: (params) => ladderForm.lattice(over(params)),
    parse: (params, text) => levelsOf('ladder', over(params).levels, text),
    emit: (_params, value) => (value.floor === value.ceiling ? value.floor : `${value.floor}..${value.ceiling}`),
    show: (params, value) => ladderForm.lattice(over(params)).show(value),
    points: (params, seed, n) => ladderForm.points(over(params), seed, n),
};
