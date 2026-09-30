import { abstain, fact, refuse } from './outcome.ts';
import { boundOf } from './values.ts';
import type { Outcome } from './outcome.ts';

export const PROTOCOL = 'bound-lock/1' as const;

export interface Line {
  readonly version: string;
  readonly fields: Readonly<Record<string, string>>;
}

const NEEDS_QUOTE = /[ ="\n\\]/;

function escape(value: string): string {
  if (!NEEDS_QUOTE.test(value)) return value;
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function unescape(token: string): string | null {
  if (!token.startsWith('"')) return NEEDS_QUOTE.test(token) ? null : token;
  if (token.length < 2 || !token.endsWith('"')) return null;

  const body = token.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i]!;
    if (c !== '\\') {
      if (c === '"') return null;
      out += c;
      continue;
    }
    const next = body[i + 1];
    if (next === '"') out += '"';
    else if (next === '\\') out += '\\';
    else if (next === 'n') out += '\n';
    else return null;
    i += 1;
  }
  return out;
}

const UTF8 = new TextEncoder();

export function byBytes(a: string, b: string): number {
  const x = UTF8.encode(a);
  const y = UTF8.encode(b);
  for (let i = 0; i < x.length && i < y.length; i++) {
    if (x[i] !== y[i]) return x[i]! - y[i]!;
  }
  return x.length - y.length;
}

/* NO UNICODE NORMALISATION — NFC and NFD are two scopes until a bridge. */
const unwritten = (fields: Readonly<Record<string, string>>): boolean => fields['form'] === 'interval' && fields['value'] !== undefined && fields['value'] !== 'withdraw' && boundOf('interval', fields['value']) === null;

export function canonical(fields: Readonly<Record<string, string>>, version = '1'): string {
  if (unwritten(fields)) throw new Error(`REFUSE·wire canonical: \`${fields['value']}\` is no interval the wire writes: two ends, each decimal or *`);
  const keys = Object.keys(fields).sort(byBytes);
  const tokens = keys.map((k) => `${k}=${escape(fields[k]!)}`);
  return [`${PROTOCOL.split('/')[0]}/${version}`, ...tokens].join(' ');
}

export function signedBytes(fields: Readonly<Record<string, string>>, version = '1'): string {
  const { sig: _sig, ...rest } = fields;
  return canonical(rest, version);
}

const ABSENT = '-';

export function parse(text: string): Outcome<Line> {
  if (text.includes('\n')) {
    return refuse('a line is one line — a newline in a value must be escaped as `\\n`');
  }

  const space = text.indexOf(' ');
  const envelope = space === -1 ? text : text.slice(0, space);
  const [name, version] = envelope.split('/');

  if (name !== PROTOCOL.split('/')[0] || !version) {
    return refuse(`no \`bound-lock/<v>\` envelope — found \`${envelope.slice(0, 24)}\``);
  }
  if (version !== PROTOCOL.split('/')[1]) {
    return abstain(`\`bound-lock/${version}\` is a version this reader does not know`);
  }

  const fields: Record<string, string> = {};
  for (const token of tokensOf(space === -1 ? '' : text.slice(space + 1))) {
    if (token === null) return refuse('a quoted value is not closed');

    const at = token.indexOf('=');
    if (at <= 0) return refuse(`\`${token.slice(0, 24)}\` is not \`key=value\``);

    const key = token.slice(0, at);
    if (key in fields) return refuse(`\`${key}\` appears twice — one line, one value per key`);

    const value = unescape(token.slice(at + 1));
    if (value === null) return refuse(`\`${key}\` has an escaping this format does not define`);

    if (value !== ABSENT) fields[key] = value;
  }

  if (unwritten(fields)) return refuse(`\`${fields['value']}\` is no interval the wire reads: two ends, each decimal or *`);
  return fact({ version, fields });
}

function* tokensOf(rest: string): Generator<string | null> {
  let at = 0;
  while (at < rest.length) {
    while (rest[at] === ' ') at += 1;
    if (at >= rest.length) return;

    let end = at;
    let quoted = false;
    while (end < rest.length && (quoted || rest[end] !== ' ')) {
      if (rest[end] === '\\' && quoted) end += 1;
      else if (rest[end] === '"') quoted = !quoted;
      end += 1;
    }
    if (quoted) {
      yield null;
      return;
    }
    yield rest.slice(at, end);
    at = end;
  }
}

