import {readFileSync} from 'node:fs';
import {walkSelection} from '../src/walk.ts';
export const declarations=JSON.parse(readFileSync(new URL('../samples/walk/declarations.json',import.meta.url),'utf8'));
export const projections=walkSelection(declarations).projections;
