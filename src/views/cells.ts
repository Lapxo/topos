/** A textual algebra view. Readings come from Obligatory; this view computes no state, meet or propagation. */
export interface CellReading {readonly cell:string;readonly state:string;readonly parts:unknown;readonly ownMarks:readonly (string|undefined)[]}
export const renderCells=(readings:readonly CellReading[]):readonly string[]=>readings.map(reading=>'CELL '+JSON.stringify(reading));
