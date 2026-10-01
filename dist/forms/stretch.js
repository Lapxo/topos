import { continuousForm } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from "./form.js";
const span = (params) => ({ lo: numberAt('stretch', params, 'lo'), hi: numberAt('stretch', params, 'hi') });
export const stretchForm = {
    id: 'stretch',
    lattice: (params) => continuousForm.lattice(span(params)),
    parse: (params, text) => bandOf('stretch', span(params), text),
    emit: (_params, value) => bandText(value),
    show: (params, value) => continuousForm.lattice(span(params)).show(value),
    points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
