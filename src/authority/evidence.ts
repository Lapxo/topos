/** Opaque values compared only against evidence admitted by the caller. No actors, clocks, signatures or policy defaults. */
export interface EvidenceInput {
  readonly expected: {readonly reference?: string; readonly value: string};
  readonly statement?: {readonly admitted: boolean; readonly reference: string; readonly value: string};
  readonly comparison?: {readonly admitted: boolean; readonly reference: string; readonly equal: boolean};
}
export interface EvidenceResult {
  readonly relation: 'absent' | 'unadmitted' | 'unresolved' | 'stale' | 'equal' | 'different';
  readonly source?: 'statement' | 'comparison';
}
export function compareEvidence(input: EvidenceInput): EvidenceResult {
  const statement = input.statement;
  if (!statement) return {relation: 'absent'};
  if (!statement.admitted) return {relation: 'unadmitted', source: 'statement'};
  if (!input.expected.reference) return {relation: 'unresolved', source: 'statement'};
  if (statement.reference === input.expected.reference) {
    return {relation: statement.value === input.expected.value ? 'equal' : 'different', source: 'statement'};
  }
  const comparison = input.comparison;
  if (comparison?.admitted && comparison.reference === input.expected.reference) {
    return {relation: comparison.equal ? 'equal' : 'different', source: 'comparison'};
  }
  return {relation: 'stale', source: 'statement'};
}
export interface VerdictObservation {readonly coordinate: string; readonly value: string}
export interface VerdictDemand {
  readonly status: 'met' | 'blocked' | 'unresolved';
  readonly scope: string;
  readonly required: readonly string[];
  readonly evidence: readonly VerdictObservation[];
  readonly reason?: string;
}
/** needs names exact evidence coordinates; value is the accepted alphabet. */
export function verdictDemand(fields: Readonly<Record<string, string>>, observed: readonly VerdictObservation[]): VerdictDemand {
  const required = [...new Set((fields.value ?? '').split('|').filter(Boolean))];
  const needs = [...new Set((fields.needs ?? '').split('|').filter(Boolean))];
  const base = {scope: fields.scope ?? '', required, evidence: [] as VerdictObservation[]};
  if (!required.length || !needs.length || needs.some(n => /[=\s\\*]/.test(n) || n.startsWith('/') || n.split('/').some(s => s === '.' || s === '..' || !s))) {
    return {...base, status: 'unresolved', reason: 'expected an accepted alphabet and exact evidence coordinates'};
  }
  const evidence = needs.flatMap(coordinate => [...new Set(observed.filter(o => o.coordinate === coordinate).map(o => o.value))].map(value => ({coordinate, value})));
  if (needs.some(coordinate => evidence.filter(e => e.coordinate === coordinate).length !== 1)) {
    return {...base, evidence, status: 'unresolved', reason: 'missing or conflicting evidence'};
  }
  return {...base, evidence, status: evidence.every(e => required.includes(e.value)) ? 'met' : 'blocked'};
}
