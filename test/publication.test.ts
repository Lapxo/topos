import { test } from 'node:test';
import { deepStrictEqual, equal, throws } from 'node:assert/strict';
import { byBytes, canonical, publicLock, publicationOf } from '../src/wire/index.ts';

const body = {
  scope: 'store/vouches', role: 'reads', form: 'alphabet', measure: 'id',
  value: 'tree', at: 'policy:instrument',
};

test('publication preserves semantics independently of delivery history', () => {
  const first = publicationOf([canonical({ ...body, by: 'writer', epoch: '7', sig: 'signature' })]);
  const deliveredAgain = publicationOf([canonical({ ...body, by: 'another', epoch: '12', sig: 'other' })]);
  deepStrictEqual(first, deliveredAgain);
  deepStrictEqual(publicLock(first), first);
  throws(() => publicationOf([canonical({ ...body, value: 'withdraw' })]), /withdrawal/);
});

test('signed history returns to the authority reader instead of becoming public input', () => {
  equal(publicLock([canonical({ ...body, by: 'writer', epoch: '7', sig: 'signature' })]), undefined);
  throws(() => publicLock([canonical({ ...body, by: 'target', epoch: '7' })]), /envelope/);
});

test('publication refuses typed history instead of erasing logical act order', () => {
  throws(() => publicationOf([canonical({
    type: 'claim', scope: 'C', id: 'c', epoch: '4', by: 'owner', sig: 'signature',
  })]), /semantic projection/);
});

test('public keys retain their signed record and output follows wire byte order', () => {
  const key = canonical({
    scope: 'keys/device', role: 'writes', form: 'alphabet', measure: 'public-key',
    value: 'public', by: 'owner', epoch: '5', sig: 'signed-key',
  });
  const projected = publicationOf([
    key,
    canonical({ ...body, scope: 'z', by: 'writer', sig: 'signed' }),
    canonical({ ...body, scope: 'a', by: 'writer', sig: 'signed' }),
  ]);
  equal(projected.includes(key), true);
  deepStrictEqual(publicLock(projected), projected);
  deepStrictEqual(projected, [...projected].sort(byBytes));
});

test('public input rejects unsigned delivery identities, withdrawals and object history', () => {
  throws(() => publicLock([canonical({ ...body, by: 'writer' })]), /unsigned delivery signer/);
  throws(() => publicLock([canonical({ ...body, by: 'target', value: 'withdraw' })]), /withdrawal/);
  throws(() => publicLock([canonical({ type: 'claim', scope: 'C', id: 'c', by: 'target' })]), /semantic projection/);
});
