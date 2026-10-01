import { region, within } from '@lapxo/obligations/field';


/** Segment boundary, not string prefix — `acme/user` must not bind `acme/userdata`. */
export function under(prefix: string, scope: string): boolean {
  return prefix !== '' && within(region(scope, './'), region(prefix, './'));
}
