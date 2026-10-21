import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as api from '@lapxo/topos/contract';

const vector = (name: string) => JSON.parse(readFileSync(new URL(`../vectors/${name}.json`, import.meta.url), 'utf8'));
const hash = (bytes: Uint8Array) => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

test('located references reproduce public bytes without treating a location as authority', () => {
  const v = vector('reference-location');
  for (const x of v.positive) {
    assert.equal(api.encodeLocatedReference(x.reference), x.fragment);
    assert.deepEqual(api.decodeLocatedReference(x.fragment), x.reference);
  }
  const r = v.positive[0].reference;
  assert.throws(() => api.encodeLocatedReference({ ...r, location: 'https://example.org/place' }), /location pair/);
  assert.equal(api.inspectLocatedReference(r, undefined, { maxBytes: 1024, digestBytes: b => hash(b).slice(7) }).kind, 'needs');
});

test('M0 declarations reproduce public bytes and reject a number without model premises', () => {
  for (const x of vector('measure-m0').positive) {
    assert.equal(api.encodeM0Measure(x.record), x.bytes);
    assert.deepEqual(api.decodeM0Measure(x.bytes), x.record);
  }
  assert.throws(() => api.inspectM0Measure({ status: 'declared', result: { value: 1 } }), /REFUSE·measure-m0/);
});

test('module inventory verifies declared export evidence and rejects altered documents', () => {
  const v = vector('module-inventory');
  const bytes = new TextEncoder().encode(v.evidenceDocument);
  const observations = v.entries.map((x: api.InventoryObservation) => ({ ...x, ...(v.moduleFiles[x.unit] === undefined ? {} : { moduleBytes: new TextEncoder().encode(v.moduleFiles[x.unit]) }) }));
  const evidence = { documents: new Map([[v.documentDigest, bytes]]), digestBytes: hash };
  assert.deepEqual(api.moduleInventory(observations, evidence), v.expectedLines);
  assert.throws(() => api.moduleInventory(observations, { ...evidence, documents: new Map([[v.documentDigest, new Uint8Array([0])]]) }), /evidence digest/);
});

test('source cards preserve public bytes and require declared authority', () => {
  for (const x of vector('source-card').positive) {
    assert.equal(api.encodeSourceCard(x.card), x.bytes);
    assert.deepEqual(api.decodeSourceCard(x.bytes), x.card);
  }
  const { authority, ...invalid } = vector('source-card').positive[0].card;
  assert.throws(() => api.encodeSourceCard(invalid), /REFUSE·source-card/);
});

test('region readings preserve public bytes and refuse selectors without matching lines', () => {
  const v = vector('region-reading'), bytes = readFileSync(new URL('../' + v.input, import.meta.url));
  for (const x of v.positive) {
    const result = api.readRegions(bytes, x.request, hash);
    assert.equal(result.count, x.count);
    assert.equal(api.encodeRegionReading(result), x.bytes);
  }
  assert.throws(() => api.readRegions(bytes, { ...v.positive[0].request, selectors: ['walk/regions/absent/**'] }, hash), /selector has no lines/);
});

test('registry declarations preserve public bytes and refuse a missing holder', () => {
  for (const x of vector('registry-place').positive) {
    assert.equal(api.encodeRegistryEntry(x.entry), x.bytes);
    assert.deepEqual(api.decodeRegistryEntry(x.bytes), x.entry);
  }
  const { holder, ...invalid } = vector('registry-place').positive[0].entry;
  assert.throws(() => api.encodeRegistryEntry(invalid), /REFUSE·registry-place/);
});

test('CI declarations preserve public bytes and keep the slash-witness compatibility boundary explicit', () => {
  for (const x of vector('ci-form').positive) {
    assert.equal(api.encodeCiDeclaration(x.declaration), x.bytes);
    assert.deepEqual(api.decodeCiDeclaration(x.bytes), x.declaration);
  }
  assert.throws(() => api.encodeCiDeclaration({ ...vector('ci-form').positive[0].declaration, witness: 'witness:ci/opaque' }), /witness slash/);
});
