import { isWireClaim, parse, wireAt } from '@lapxo/topos/wire';

const fieldsOf = (text: string): Readonly<Record<string, string>> => {
  const got = parse(text);
  return got.kind === 'fact' ? got.value.fields : {};
};

test('isWireClaim reads wire/ and the older audit/wire/', () => {
  compare(isWireClaim(fieldsOf('bound-lock/1 scope=wire/fields form=alphabet measure=id role=reads value=a')), true);
  compare(isWireClaim(fieldsOf('bound-lock/1 scope=audit/wire/fields form=alphabet measure=id role=reads value=a')), true);
  compare(isWireClaim(fieldsOf('bound-lock/1 scope=keys/owner form=alphabet measure=id role=reads value=a')), false);
});

test('wireAt prefers wire/ at the same epoch and still reads audit/wire/ alone', () => {
  const older = fieldsOf('bound-lock/1 epoch=1 form=alphabet measure=id role=reads scope=audit/wire/forms value=alphabet');
  const newer = fieldsOf('bound-lock/1 epoch=1 form=alphabet measure=id role=reads scope=wire/forms value=alphabet|interval');
  compare([...(wireAt([older], 1)?.forms ?? [])].sort(), ['alphabet']);
  compare([...(wireAt([older, newer], 1)?.forms ?? [])].sort(), ['alphabet', 'interval']);
});
