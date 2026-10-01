import { alphabetForm, WideMask } from '@lapxo/obligations';
import { alphabet } from '../wire/grammar.ts';
import { refuseForm, wordsAt, written } from './form.ts';
import type { WireForm } from './form.ts';

const tokensOf = (params: unknown): { readonly tokens: readonly string[] } => ({ tokens: wordsAt('alphabet', params, 'tokens') });

export const alphabetOfForm: WireForm<WideMask> = {
  id: 'alphabet',
  lattice: (params) => alphabetForm.lattice(tokensOf(params)),
  parse(params, text) {
    const { tokens } = tokensOf(params);
    const read = alphabet(text);
    const stray = read.members.find((one) => !tokens.includes(one));
    if (stray !== undefined) refuseForm('alphabet', `\`${stray}\` is not one of its tokens`);
    return WideMask.fromTokens(tokens, new Set(read.polarity === 'forbid' ? tokens.filter((one) => !read.members.includes(one)) : read.members));
  },
  emit: (params, value) => written(value.members(tokensOf(params).tokens)),
  show: (params, value) => alphabetForm.lattice(tokensOf(params)).show(value),
  points: (params, seed, n) => alphabetForm.points(tokensOf(params), seed, n),
};
