import { continuousForm } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from "./form.js";
const span = (params) => ({ lo: numberAt('budget', params, 'lo'), hi: numberAt('budget', params, 'hi') });
export const budgetForm = {
    id: 'budget',
    lattice: (params) => continuousForm.lattice(span(params)),
    parse: (params, text) => bandOf('budget', span(params), text),
    emit: (_params, value) => bandText(value),
    show: (params, value) => continuousForm.lattice(span(params)).show(value),
    points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
