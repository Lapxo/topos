import { unpipe } from './values.ts';

export interface Alphabet {
  readonly polarity: 'permit' | 'forbid';
  readonly members: readonly string[];
}
export type Field = readonly [key: string, value: string];
export interface Resolution {
  readonly name: string;
  readonly at?: number | '*';
}
export interface Requirement {
  readonly name: string;
  readonly range: string;
}
const [FORBID, EMPTY, MEMBER, PAIR, STEP, AT, EVERY, ESCAPE] = ['not:', 'none', '|', '=', '/', '@', '*', '\\'] as const;
const refuse = (grammar: string, why: string): never => {
  throw new Error(`REFUSE·wire ${grammar}: ${why}`);
};
const digits = (text: string): boolean => text !== '' && [...text].every((one) => one >= '0' && one <= '9');

/**
 * The grammars inside a value, one function each: handed the text a line carries it reads the value, handed the value
 * it writes the canonical text, and what it writes reads back to what it was handed. A value is read after its line has
 * unquoted it, and nothing outside the wire splits one.
 */
export function alphabet(text: string): Alphabet;
export function alphabet(value: Alphabet): string;
export function alphabet(given: string | Alphabet): Alphabet | string {
  if (typeof given !== 'string') {
    const written = given.members.map((one) => one.split(ESCAPE).join(ESCAPE + ESCAPE).split(MEMBER).join(ESCAPE + MEMBER)).join(MEMBER);
    if (given.polarity === 'forbid') return FORBID + written;
    return written.startsWith(FORBID) || written === EMPTY ? refuse('alphabet', 'a permitted alphabet neither begins with not: nor is the one word none') : written || EMPTY;
  }
  const forbid = given.startsWith(FORBID);
  const body = forbid ? given.slice(FORBID.length) : given;
  const members = !forbid && body === EMPTY ? [] : unpipe(body) ?? refuse('alphabet', 'a backslash escapes only a pipe or itself');
  return { polarity: forbid ? 'forbid' : 'permit', members: members.filter((one) => one !== '') };
}

export function fields(text: string): readonly Field[];
export function fields(value: readonly Field[]): string;
export function fields(given: string | readonly Field[]): readonly Field[] | string {
  if (typeof given !== 'string') return alphabet({ polarity: 'permit', members: given.map(([key, value]) => key + PAIR + value) });
  const read = alphabet(given);
  if (read.polarity === 'forbid') refuse('fields', 'fields carry no polarity');
  return read.members.map((one) => (one.indexOf(PAIR) > 0 ? [one.slice(0, one.indexOf(PAIR)), one.slice(one.indexOf(PAIR) + 1)] as const : refuse('fields', `\`${one}\` is not key=value`)));
}

export function steps(text: string): readonly string[];
export function steps(value: readonly string[]): string;
export function steps(given: string | readonly string[]): readonly string[] | string {
  if (typeof given === 'string') return given.split(STEP);
  return given.some((one) => one.includes(STEP)) ? refuse('steps', 'a step holds no slash') : given.join(STEP);
}

export function atResolution(text: string): Resolution;
export function atResolution(value: Resolution): string;
export function atResolution(given: string | Resolution): Resolution | string {
  if (typeof given !== 'string') return given.at === undefined ? given.name : given.name + AT + String(given.at);
  const at = given.lastIndexOf(AT);
  if (at < 0) return { name: given };
  const [name, said] = [given.slice(0, at), given.slice(at + 1)];
  if (name === '' || (said !== EVERY && !digits(said))) refuse('atResolution', `\`${given}\` is not name@digits or name@*`);
  return { name, at: said === EVERY ? EVERY : Number(said) };
}

export function requirement(text: string): Requirement;
export function requirement(value: Requirement): string;
export function requirement(given: string | Requirement): Requirement | string {
  if (typeof given !== 'string') return given.name === '' || given.range === '' || given.range.includes(AT) ? refuse('requirement', 'a requirement names what it requires and a range, with no at sign') : given.name + AT + given.range;
  const at = given.lastIndexOf(AT);
  return at > 0 && at < given.length - 1 ? { name: given.slice(0, at), range: given.slice(at + 1) } : refuse('requirement', `\`${given}\` is not name@range`);
}
