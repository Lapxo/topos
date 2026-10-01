import type { Claim, Outcome } from './types.ts';
type ClaimDraft = Partial<Claim> & Pick<Claim, 'scope' | 'measure' | 'bound' | 'role'>;
export declare function claim(draft: ClaimDraft): Outcome<Claim>;
export {};
