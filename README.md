<p align="center"><img src="docs/img/logo.svg" alt="" width="96"></p>

# @lapxo/topos

![version 0.1.3](https://img.shields.io/badge/version-0.1.3-8c959f) ![license MIT](https://img.shields.io/badge/license-MIT-8c959f) ![node >=22.12](https://img.shields.io/badge/node-%3E%3D22.12-8c959f) ![dependencies 1](https://img.shields.io/badge/dependencies-1-8c959f) ![cases 0 hold](https://img.shields.io/badge/cases-0_hold-8c959f) ![verify agrees](https://img.shields.io/badge/verify-agrees-2da44e)

One line for every fact.

bound's SDK: the wire, the forms, the contract and the shell you build a world with — a reader of any source or a renderer of any artefact, in an afternoon. [in its own words](docs/what.md)

## Why one line

Everything a system says about itself lives where nobody can check it: a config, a README, a CI log. topos is one line format for all of it — a signed line with a floor and a ceiling, that any head can fold and any second head can verify. Two implementations agree only on what passes between them, and what passes between them is a line. So the line is the one thing held still; everything else belongs to a world.

## What it claims

- **It round-trips: every line of its 0 wire corpora parses and writes back the same bytes.** · [receipt](receipts.bound)
- **It reads once: a value is read in its wire, by its form, and its ceiling on reading one anywhere else reads 0.** · [receipt](receipts.bound)
- **It knows no world: it says nothing a world says, and its ceiling on a world's words, markup or figures written in its source reads 0.** · [receipt](receipts.bound)
- **It writes no order of its own: cells, meets, joins and states come from the object, and its ceiling on an order written here reads 0.** · [receipt](receipts.bound)

## Line

Add to your lock:
sources/topos value=github:Lapxo/topos
uses/topos sha256:<release digest>
Fetch the release asset, verify its sha256 equals the uses/ line, place it in bound/cas/blobs/. Fold: its pages appear.
open: line/install needs=host/resolve — when bound resolves sources/ itself, the fetch line leaves the page by fold.

It rests on obligations. Nothing else.

## Check

● 0 cases hold

● `npm ci && npm run build`

## Pointers

- [Wire](docs/wire.md)
