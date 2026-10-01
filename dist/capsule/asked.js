import { alphabet } from "../wire/grammar.js";
export const of = (line, field) => line?.[field] ?? '';
export const found = (asked, scope) => asked.lines.find((line) => of(line, 'scope') === scope);
export const value = (asked, scope) => (found(asked, scope) === undefined ? undefined : of(found(asked, scope), 'value'));
export const listed = (asked, scope) => alphabet(value(asked, scope) ?? '').members;
export const lang = (asked) => value(asked, 'lang') ?? '';
export const receipts = (asked, region) => asked.regions[region]?.receipts ?? [];
export const placeOf = (line) => of(line, 'at').replace(/^[^:]*:/, '');
export const regionLines = (asked, region) => asked.regions[region]?.lines ?? [];
