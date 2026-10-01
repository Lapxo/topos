/**
 * Authority is the direction of the move, not the kind of actor.
 * Narrow is attest. Widen is authorize.
 *
 * Seven state actions. `foreign` is a location (out of domain), not a verb.
 * `derives` is a reference relation, not a movement.
 */
type Motion = 'narrow' | 'widen';
export type KeyClass = 'attest' | 'authorize';
export declare function keyClassFor(motion: Motion): KeyClass;
export {};
