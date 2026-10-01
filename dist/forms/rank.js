import { continuousForm } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from "./form.js";
const span = (params) => ({ lo: 0, hi: numberAt('rank', params, 'n') });
export const rankForm = {
    id: 'rank',
    lattice: (params) => continuousForm.lattice(span(params)),
    parse: (params, text) => bandOf('rank', span(params), text),
    emit: (_params, value) => bandText(value),
    show: (params, value) => continuousForm.lattice(span(params)).show(value),
    points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
