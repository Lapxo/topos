import { continuousForm } from '@lapxo/obligations';
import { bandOf, bandText, numberAt } from "./form.js";
const span = (params) => ({ lo: numberAt('interval', params, 'lo'), hi: numberAt('interval', params, 'hi') });
export const intervalForm = {
    id: 'interval',
    lattice: (params) => continuousForm.lattice(span(params)),
    parse: (params, text) => bandOf('interval', span(params), text),
    emit: (_params, value) => bandText(value),
    show: (params, value) => continuousForm.lattice(span(params)).show(value),
    points: (params, seed, n) => continuousForm.points(span(params), seed, n),
};
