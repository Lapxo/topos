# The wire

A lock is a file of lines, and a line is all that passes between two implementations: one line of UTF-8 text, a header and its fields. This page is the grammar of bound-lock/1. The functions of `topos/wire` are its reference, and the corpus below holds them to it.

## The header

A line begins with its header, bound-lock/1: the name of the protocol, a slash and its version. A line without a header is refused. A version this reader does not know is held, not refused, because it is the future arriving.

## Fields

After the header come the fields, each `key=value`, apart by runs of spaces. A key appears once, and a line that names one twice is refused. A value `-` is absence, and the field reads as unwritten. A field no reader knows rides through untouched. `needs` names coordinates by path, never by digest: steps apart by `/`, a wildcard only in the last step. A line rests on bytes in `restsOn`, an alphabet whose member is their digest, `sha256:` and 64 lowercase hex digits; a member that is a scope rests on that line instead. For example: `bound-lock/1 at=witness:a-second-head-that-never-said-what-it-is by=owner form=alphabet measure=status needs=verify/docs/what.md restsOn=sha256:fd99c1421a6a4ccabc4de5a34e1d604e68a66d31004d651d3be982f1c0c623e6 role=demands scope=verify/docs/what shape=render value=present`.

## Quoting

A value that holds a space, an equals sign, a double quote, a backslash or a newline is written in double quotes. Inside them `\"` is a quote, `\\` a backslash and `\n` a newline, and any other escape is refused. A value that needs no quotes never gets them.

## Bytes

A line is UTF-8 bytes, and nothing normalises them: two spellings of one letter are two scopes until a line says they are one.

## Order

Every order the wire makes is the order of UTF-8 bytes, never a host's: the keys of a canonical line, and the members of every set a value holds. A character beyond the basic plane sorts above every character within it, where a host counting in pairs of sixteen bits sorts it below.

## One line

A line is one line. A newline inside a value is written `\n`, and a file of lines ends every line with a newline.

## Canonical and parse

The canonical line is the header, then every field in the byte order of its key, one space apart, each value quoted only where it must be. Parsing a canonical line and writing it again gives back the same bytes. The digest of a line is the sha256 of those bytes, and a signature travels beside the bytes it signs, never inside them.

## Inside a value

The kernel never looks inside a value; each value has its own grammar, one function each in `topos/wire`. An alphabet is members apart by `|`, with `\|` and `\\` escaped, `not:` before them to forbid and `none` for no member at all. Fields are `key=value` members of an alphabet, parted at the first `=`. A scope is steps apart by `/`, every step kept. A region is `name@resolution`, its resolution digits or `*`. A requirement is `name@range`, parted at its last `@`, so a scoped name keeps its own. Each function reads its text and writes it back canonical, and what it writes reads back the same.

## Numbers

A number has one spelling: decimal digits, a minus when it is negative and a fraction when it has one. No exponent, no hex, no leading dot, no padding. The wire writes every number that way itself, from the shortest digits that read back to it, and reads no other spelling; an interval is two such ends or `*`. Two heads in two languages write the same bytes.

## A world's blob

A world travels as a blob: capsule.bound and its build, split as ES modules, one region per file — dist/index.js the entry, dist/regions/<name>.js each region the lock names — packed as one tar, gzipped and named by the sha256 digest of its bytes. The entry names only where the world lies; the host is handed the lock already parsed and loads each region from its own file by its name and its role.

## The reference

| function | as the language reads it |
|---|---|
| `parse` | `parse(text: string): Outcome<Line>` |
| `canonical` | `canonical(fields: Readonly<Record<string, string>>, version = '1'): string` |
| `signedBytes` | `signedBytes(fields: Readonly<Record<string, string>>, version = '1'): string` |
| `byBytes` | `byBytes(a: string, b: string): number` |
| `alphabet` | `alphabet(text: string): Alphabet; alphabet(value: Alphabet): string` |
| `fields` | `fields(text: string): readonly Field[]; fields(value: readonly Field[]): string` |
| `steps` | `steps(text: string): readonly string[]; steps(value: readonly string[]): string` |
| `atResolution` | `atResolution(text: string): Resolution; atResolution(value: Resolution): string` |
| `requirement` | `requirement(text: string): Requirement; requirement(value: Requirement): string` |
| `decimal` | `decimal(n: number): string` |

## The corpus

- `vector/spec/bound-lock-1` · 
- `vector/spec/fold` · 
- `vector/spec/values` · 
