import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { answer, respond } from '../src/contract/index.ts';
import type { Asked } from '../src/capsule/index.ts';
import { PROTOCOL } from '../src/wire/line.ts';
import type { Request, Response } from '../src/wire/spec.ts';

const held = {
  alpha: { lines: ['bound-lock/1 scope=region/alpha measure=reads value=item/*'], receipts: ['bound-lock/1 scope=item/zero measure=units value=0..0 by=reader:fixture at=sha256:fixture'] },
  beta: { lines: ['bound-lock/1 scope=region/beta measure=reads value=item/*'], receipts: ['bound-lock/1 scope=item/span measure=units value=2..5 by=reader:other at=sha256:other'] },
  'nested/leaf': { lines: [], receipts: [] },
};
const request = (reads?: readonly string[]): Request => ({ protocol: PROTOCOL, verb: 'render', rootScope: '', files: [], region: 'compose', ...(reads === undefined ? {} : { reads }), regions: held });
const names = { render: (asked: Asked) => Object.keys(asked.regions) };

test('serialized region wildcards bind concrete authorized regions without crossing a path segment', () => {
  const got = JSON.parse(respond(names, JSON.stringify([request(['region/*']), request(['region/**'])]), 'fixture')) as Response[];
  deepStrictEqual(got, [
    { protocol: PROTOCOL, kind: 'fact', lines: ['alpha', 'beta'] },
    { protocol: PROTOCOL, kind: 'fact', lines: ['alpha', 'beta', 'nested/leaf'] },
  ]);
});

test('an exact selector grants one region while partial names and unrelated scopes grant none', () => {
  deepStrictEqual(answer(names, request(['region/alpha']), '').lines, ['alpha']);
  for (const reads of [['region/al'], ['item/**'], ['region/alpha/child'], ['not:region/alpha']]) {
    deepStrictEqual(answer(names, request(reads), '').lines, []);
  }
});

test('missing and empty reads do not acquire regions supplied in the request', () => {
  deepStrictEqual(answer(names, request(), '').lines, []);
  deepStrictEqual(answer(names, request([]), '').lines, []);
  deepStrictEqual(answer(names, { ...request(['region/*']), regions: undefined }, '').lines, []);
});

test('the wire matcher handles interior globs and nested selectors with the same scope semantics as handed lines', () => {
  deepStrictEqual(answer(names, request(['region/a*']), '').lines, ['alpha']);
  deepStrictEqual(answer(names, request(['region/nested/*']), '').lines, ['nested/leaf']);
  deepStrictEqual(answer(names, request(['**']), '').lines, ['alpha', 'beta', 'nested/leaf']);
});

test('serialized render receives a real zero and interval with their original provenance', () => {
  let received: Asked | undefined;
  const module = { render: (asked: Asked) => { received = asked; return []; } };
  const got = JSON.parse(respond(module, JSON.stringify([request(['region/*'])]), 'fixture')) as Response[];
  strictEqual(got[0]?.kind, 'fact');
  deepStrictEqual(received?.regions['alpha']?.receipts, [{ scope: 'item/zero', measure: 'units', value: '0..0', by: 'reader:fixture', at: 'sha256:fixture' }]);
  deepStrictEqual(received?.regions['beta']?.receipts, [{ scope: 'item/span', measure: 'units', value: '2..5', by: 'reader:other', at: 'sha256:other' }]);
  strictEqual(received?.regions['nested/leaf'], undefined);
});

test('receipt readers use the same serialized selector boundary and retain an absent region as absence', () => {
  const module = { receipt: (asked: Asked) => Object.entries(asked.regions).map(([region, rows]) => ({ region, receipts: rows.receipts })) };
  const got = JSON.parse(respond(module, JSON.stringify([{ ...request(['region/alpha', 'region/missing']), verb: 'read' }]), 'fixture')) as Response[];
  deepStrictEqual(got[0]?.claims, [{ region: 'alpha', receipts: [{ scope: 'item/zero', measure: 'units', value: '0..0', by: 'reader:fixture', at: 'sha256:fixture' }] }]);
});

test('top-level lines remain restricted by the same selectors, including withdrawal filtering', () => {
  let received: Asked | undefined;
  answer({ render: (asked) => { received = asked; return []; } }, {
    ...request(['region/alpha']),
    lines: ['bound-lock/1 scope=region/alpha measure=reads value=item/*', 'bound-lock/1 scope=region/beta measure=reads value=item/*', 'bound-lock/1 scope=region/alpha measure=reads value=withdraw'],
  }, '');
  deepStrictEqual(received?.lines, [{ scope: 'region/alpha', measure: 'reads', value: 'item/*' }]);
});

test('file observations continue to receive the bytes handed by the host', () => {
  const module = { observe: (bytes: Uint8Array) => [new TextDecoder().decode(bytes)] };
  const got = JSON.parse(respond(module, JSON.stringify([{ protocol: PROTOCOL, verb: 'read', rootScope: 'entry', files: [{ place: 'entry', text: '0' }] }]), 'fixture')) as Response[];
  deepStrictEqual(got[0]?.claims, ['0']);
});
