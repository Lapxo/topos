/**
 * Three arms, and there is no fourth. Isolated so the line kernel
 * does not import the rest of the wire.
 */
export type Outcome<T> =
  | { readonly kind: 'fact'; readonly value: T }
  | { readonly kind: 'abstain'; readonly why: string }
  | { readonly kind: 'refuse'; readonly why: string; readonly named?: string };

export const fact = <T>(value: T): Outcome<T> => ({ kind: 'fact', value });
export const abstain = <T>(why: string): Outcome<T> => ({ kind: 'abstain', why });
export const refuse = <T>(why: string, named?: string): Outcome<T> =>
  ({ kind: 'refuse', why, ...(named === undefined ? {} : { named }) });
