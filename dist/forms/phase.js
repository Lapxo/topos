import { continuousForm } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from "./form.js";
const span = (params) => ({ lo: numberAt('phase', params, 'lo'), hi: numberAt('phase', params, 'hi') });
export const phaseForm = {
    id: 'phase',
    lattice: (params) => continuousForm.lattice(span(params)),
    parse: (params, text) => bandOf('phase', span(params), text),
    emit: (_params, value) => bandText(value),
    show: (params, value) => continuousForm.lattice(span(params)).show(value),
    points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
