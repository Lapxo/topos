import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import { actBytes, actIdentity, actResultOf, actResultProfile } from '../src/wire/act-result.ts';
import { canonical, parse, signedBytes } from '../src/wire/line.ts';

const key = generateKeyPairSync('ed25519');
const digest = (bytes: string): string => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const signed = (fields: Record<string, string>): string => canonical({ ...fields,
  sig: 'ed25519:' + sign(null, Buffer.from(signedBytes(fields)), key.privateKey).toString('base64') });
const admits = (line: string): boolean => {
  const got = parse(line);
  if (got.kind !== 'fact' || got.value.fields['by'] !== 'owner') return false;
  return verify(null, Buffer.from(signedBytes(got.value.fields)), key.publicKey,
    Buffer.from(got.value.fields['sig']!.slice('ed25519:'.length), 'base64'));
};
const contract = { scope: 'receipts/acts', context: 'receipt:local', digest,
  admitsRecord: (line:string,localEpoch:number):boolean=>{
    const p=parse(line);
    return admits(line) && p.kind==='fact'
      && (p.value.fields['type']!==undefined || p.value.fields['epoch']===String(localEpoch));
  }, verifiesReceipt: admits };
const row = (scope: string, value: string, epoch = '7', by = 'owner'): string => signed({
  scope, value, epoch, by, role: 'writes', form: 'alphabet', measure: 'id', at: 'place:own' });
const receiptOf = (records: readonly string[], changes: Record<string, string> = {}): string => signed({
  scope: contract.scope, at: contract.context, epoch: '7', by: 'owner', role: 'writes',
  form: 'alphabet', measure: 'digest', value: actIdentity(records,contract), ...changes });

for (const scope of ['catalogue/items', 'research/observations']) {
  test(`public result authenticates original ordered records: ${scope}`, () => {
    const records = [row(scope, 'first'), row(scope, 'second')];
    const receipt = receiptOf(records);
    const result = actResultOf(records, receipt, contract);
    assert.deepEqual(result, { identity: actIdentity(records,contract), epoch: 7, records, receipt });
    assert.deepEqual(actResultOf(records, receipt, contract), result);
    assert.notEqual(actIdentity([...records].reverse(),contract), result.identity);
    assert.notEqual(actIdentity(records,{...contract,context:'receipt:another-place'}),result.identity);
    assert.throws(() => actResultOf(records,receipt,{...contract,context:'receipt:another-place'}),/does not bind/);
    assert.throws(() => actResultOf([...records].reverse(), receipt, contract), /does not bind/);
    assert.throws(() => actResultOf([records[0]!, row(scope, 'tampered')], receipt, contract), /does not bind/);
  });
}
test('native receipt must bind the local epoch, coordinate, context and admitted signer', () => {
  const records = [row('catalogue/items', 'first')];
  for (const changes of [{ epoch: '8' }, { scope: 'other/receipt' }, { at: 'receipt:foreign' },
    { role: 'demands' }, { by: 'stranger' }]) {
    assert.throws(() => actResultOf(records, receiptOf(records, changes), contract), /REFUSE·act/);
  }
  const foreign = [row('catalogue/items', 'first', '7', 'stranger')];
  assert.throws(() => actResultOf(foreign, receiptOf(foreign), contract), /not admitted/);
  const receipt = receiptOf(records).replace(/sig=[^ ]+/, 'sig=ed25519:AAAA');
  assert.throws(() => actResultOf(records, receipt, contract), /does not verify/);
});
test('receipt evidence has its own verifier and never authorizes an act', () => {
  const records = [row('research/observations', 'first')];
  const got = parse(receiptOf(records));
  assert.equal(got.kind, 'fact');
  if (got.kind !== 'fact') return;
  const { sig: _sig, ...fields } = got.value.fields;
  const receipt = canonical({ ...fields, by: 'fold' });
  assert.throws(() => actResultOf(records, receipt, contract), /does not verify/);
  // This profile accepts this native receipt from its committed local boundary.
  const local = { ...contract, verifiesReceipt: (line: string) => line === receipt };
  assert.equal(actResultOf(records, receipt, local).receipt, receipt);
  assert.throws(() => actResultOf(records, receipt, { ...local, admitsRecord: () => false }), /not admitted/);
});
test('act identity preserves signed envelope and refuses ambiguous or truncated input', () => {
  const first = row('catalogue/items', 'first');
  assert.notEqual(actBytes([first]), actBytes([row('catalogue/items', 'first', '8')]));
  assert.notEqual(actBytes([first]), actBytes([row('catalogue/items', 'first', '7', 'stranger')]));
  const withOtherSignature = first.replace(/sig=[^ ]+/, 'sig=ed25519:OTHER');
  assert.equal(actBytes([first]), actBytes([withOtherSignature]));
  assert.throws(() => actBytes([]), /empty lot/);
  assert.throws(() => actBytes([first, withOtherSignature]), /duplicate/);
  const mixed=[first,row('catalogue/items','second','8')];
  assert.throws(() => actResultOf(mixed,receiptOf(mixed),contract), /not admitted/);
  assert.throws(() => actBytes([first + '\n']), /noncanonical/);
  assert.throws(() => actBytes([row('catalogue/items', 'first', '07')]), /invalid local epoch/);
});
test('result projection retains admitted object clocks separately from the local receipt clock',()=>{
  const records=['2','3'].map((epoch,i)=>signed({scope:'observations',type:'claim',id:'claim-'+i,
    sign:'+1',origin:'origin-a',value:'2..3',by:'owner',epoch}));
  const result=actResultOf(records,receiptOf(records),contract);
  assert.equal(result.epoch,7);
  assert.deepEqual(result.records,records);
});

test('routing and local commit clock bind an act without rewriting its signed records',()=>{
  const records=[row('catalogue/items','first'),row('catalogue/items','second')];
  const local={...contract,localEpoch:7,placements:[{place:'.',records}]};
  const identity=actIdentity(records,local);
  assert.notEqual(actIdentity(records,{...local,localEpoch:8}),identity);
  assert.notEqual(actIdentity(records,{...local,placements:[{place:'child/TARGET.bound',records}]}),identity);
  assert.notEqual(actIdentity(records,{...local,placements:[{place:'.',records:[...records].reverse()}]}),identity);
  assert.throws(()=>actIdentity(records,{...local,placements:[{place:'.',records:records.slice(0,1)}]}),/unassigned/);
  assert.throws(()=>actIdentity(records,{...local,placements:[{place:'../outside',records}]}),/coordinate/);
  const receipt=receiptOf(records,{value:identity});
  assert.deepEqual(actResultOf(records,receipt,local).records,records);
  assert.throws(()=>actResultOf(records,receipt,{...local,localEpoch:8}),/does not bind/);
});

test('native results require an explicit unambiguous admitted profile',()=>{
  const profile=(scope:string,value:string)=>canonical({scope,value,role:'writes',form:'alphabet',measure:'id',at:'policy:result',by:'owner'});
  const lines=[profile('wire/act-result','local-act@1'),profile('wire/act-result-scope','receipts'),profile('wire/act-result-context','receipt:local')];
  assert.equal(actResultProfile([]),undefined);
  assert.deepEqual(actResultProfile(lines),{scope:'receipts',context:'receipt:local'});
  assert.throws(()=>actResultProfile(lines.slice(0,1)),/incomplete/);
  assert.throws(()=>actResultProfile([...lines,profile('wire/act-result','other')]),/conflicting/);
});
