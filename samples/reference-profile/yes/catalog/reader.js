// work/bound-0.2.0/reference-native/entry.ts
import { createHash } from "node:crypto";

// work/bound-0.2.0/reference-native/reference.js
var hex = /^[0-9a-f]{64}$/;
var refuse = (cause) => {
  throw Error(`REFUSE\xB7reference ${cause}`);
};
var keys = ["class", "algorithm", "digest", "blob", "source"];
function check(reference) {
  if (Object.keys(reference).length !== keys.length || keys.some((key) => !Object.hasOwn(reference, key))) refuse("fields");
  if (reference.class !== "standing") refuse("unknown class");
  if (reference.algorithm !== "sha256") refuse("unknown algorithm");
  if (!hex.test(reference.digest) || !/^sha256:[0-9a-f]{64}$/.test(reference.blob)) refuse("digest");
  let source;
  try {
    source = new URL(reference.source);
  } catch {
    refuse("source URL");
  }
  if (source.username || source.password || source.hash) refuse("source credentials or fragment");
  if (source.href !== reference.source) refuse("noncanonical source URL");
  return reference;
}
function encodeReference(reference) {
  check(reference);
  return "#bound:1?" + keys.map((key) => key + "=" + encodeURIComponent(reference[key])).join("&");
}
function decodeReference(fragment) {
  if (!fragment.startsWith("#bound:1?")) refuse("profile");
  const parameters = new URLSearchParams(fragment.slice("#bound:1?".length));
  if ([...parameters].length !== keys.length || new Set(parameters.keys()).size !== keys.length) refuse("duplicate or missing field");
  const reference = check(Object.fromEntries(parameters));
  if (encodeReference(reference) !== fragment) refuse("noncanonical encoding");
  return Object.freeze(reference);
}
function inspectReferenceBytes(reference, bytes, { maxBytes, readSemanticStanding: readSemanticStanding2, semanticStandingBytes: semanticStandingBytes2, digestBytes }) {
  if (bytes.byteLength > maxBytes) refuse("bytes budget");
  if (digestBytes(bytes) !== reference.blob.slice(7)) refuse("blob integrity");
  let document;
  try {
    document = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    refuse("document");
  }
  if (document === null || typeof document !== "object" || document.profile !== "semantic-standing@1" || typeof document.standing !== "string" || Object.keys(document).length !== 2) refuse("document profile");
  if (new TextDecoder("utf-8", { fatal: true }).decode(bytes) !== JSON.stringify({ profile: document.profile, standing: document.standing })) refuse("noncanonical document wrapper");
  const lines = readSemanticStanding2(document.standing);
  const semantic = semanticStandingBytes2(lines);
  if (digestBytes(new TextEncoder().encode(semantic)) !== reference.digest) refuse("standing identity");
  return { reference, lines, standing: semantic, authentication: "not demonstrated; inspect only" };
}

// work/topos-0.1.17/clean-consumer/node_modules/@lapxo/topos/dist/wire/outcome.js
var fact = (value) => ({ kind: "fact", value });
var abstain = (why) => ({ kind: "abstain", why });
var refuse2 = (why, named) => ({ kind: "refuse", why, ...named === void 0 ? {} : { named } });

// work/topos-0.1.17/clean-consumer/node_modules/@lapxo/topos/dist/wire/values.js
function unpipe(value) {
  const out = [];
  let at = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "\\") {
      const next = value[i + 1];
      if (next !== "|" && next !== "\\")
        return null;
      at += next;
      i += 1;
    } else if (c === "|") {
      out.push(at);
      at = "";
    } else {
      at += c;
    }
  }
  out.push(at);
  return out;
}
var OPEN = "*";
var num = (s) => {
  if (!/^-?\d+(\.\d+)?$/.test(s))
    return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
};
var GRAMMARS = {
  interval: (value) => {
    const at = value.indexOf("..");
    if (at < 0)
      return null;
    const lo = value.slice(0, at);
    const hi = value.slice(at + 2);
    const l = lo === OPEN ? null : num(lo);
    const h = hi === OPEN ? null : num(hi);
    if (lo !== OPEN && l === null || hi !== OPEN && h === null)
      return null;
    return { kind: "interval", lo: l, hi: h };
  },
  alphabet: (value) => {
    const values = unpipe(value);
    return values === null ? null : { kind: "enumerated", values };
  },
  ladder: (value) => {
    const parts = unpipe(value);
    if (parts === null || parts.length !== 2)
      return null;
    return { kind: "band", floor: parts[0] ?? "", ceiling: parts[1] ?? "" };
  }
};
function boundOf(form, value, grammars) {
  const extra = Array.isArray(grammars) ? grammars.find((g) => g.form === form) : void 0;
  if (extra)
    return extra.parse(value);
  return GRAMMARS[form]?.(value) ?? null;
}
var BOUND_FORMS = Object.keys(GRAMMARS);

// work/topos-0.1.17/clean-consumer/node_modules/@lapxo/topos/dist/wire/line.js
var PROTOCOL = "bound-lock/1";
var NEEDS_QUOTE = /[ ="\n\\]/;
function escape(value) {
  if (!NEEDS_QUOTE.test(value))
    return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}
function unescape(token) {
  if (!token.startsWith('"'))
    return NEEDS_QUOTE.test(token) ? null : token;
  if (token.length < 2 || !token.endsWith('"'))
    return null;
  const body = token.slice(1, -1);
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== "\\") {
      if (c === '"')
        return null;
      out += c;
      continue;
    }
    const next = body[i + 1];
    if (next === '"')
      out += '"';
    else if (next === "\\")
      out += "\\";
    else if (next === "n")
      out += "\n";
    else
      return null;
    i += 1;
  }
  return out;
}
var UTF8 = new TextEncoder();
function byBytes(a, b) {
  const x = UTF8.encode(a);
  const y = UTF8.encode(b);
  for (let i = 0; i < x.length && i < y.length; i++) {
    if (x[i] !== y[i])
      return x[i] - y[i];
  }
  return x.length - y.length;
}
var unwritten = (fields) => fields["form"] === "interval" && fields["value"] !== void 0 && fields["value"] !== "withdraw" && boundOf("interval", fields["value"]) === null;
function canonical(fields, version = "1") {
  if (unwritten(fields))
    throw new Error(`REFUSE\xB7wire canonical: \`${fields["value"]}\` is no interval the wire writes: two ends, each decimal or *`);
  const keys2 = Object.keys(fields).sort(byBytes);
  const tokens = keys2.map((k) => `${k}=${escape(fields[k])}`);
  return [`${PROTOCOL.split("/")[0]}/${version}`, ...tokens].join(" ");
}
var ABSENT = "-";
function parse(text, options = {}) {
  if (text.includes("\n")) {
    return refuse2("a line is one line \u2014 a newline in a value must be escaped as `\\n`");
  }
  const space = text.indexOf(" ");
  const envelope = space === -1 ? text : text.slice(0, space);
  const [name, version] = envelope.split("/");
  if (name !== PROTOCOL.split("/")[0] || !version) {
    return refuse2(`no \`bound-lock/<v>\` envelope \u2014 found \`${envelope.slice(0, 24)}\``);
  }
  if (version !== PROTOCOL.split("/")[1]) {
    return abstain(`\`bound-lock/${version}\` is a version this reader does not know`);
  }
  const fields = {};
  const writtenKeys = /* @__PURE__ */ new Set();
  for (const token of tokensOf(space === -1 ? "" : text.slice(space + 1))) {
    if (token === null)
      return refuse2("a quoted value is not closed");
    const at = token.indexOf("=");
    if (at <= 0)
      return refuse2(`\`${token.slice(0, 24)}\` is not \`key=value\``);
    const key = token.slice(0, at);
    if (writtenKeys.has(key))
      return refuse2(`\`${key}\` appears twice \u2014 one line, one value per key`);
    writtenKeys.add(key);
    const value = unescape(token.slice(at + 1));
    if (value === null)
      return refuse2(`\`${key}\` has an escaping this format does not define`);
    if (value !== ABSENT)
      fields[key] = value;
  }
  if (unwritten(fields))
    return refuse2(`\`${fields["value"]}\` is no interval the wire reads: two ends, each decimal or *`);
  return fact({ version, fields, ...options.preserveKeys ? { keys: [...writtenKeys] } : {} });
}
function* tokensOf(rest) {
  let at = 0;
  while (at < rest.length) {
    while (rest[at] === " ")
      at += 1;
    if (at >= rest.length)
      return;
    let end = at;
    let quoted = false;
    while (end < rest.length && (quoted || rest[end] !== " ")) {
      if (rest[end] === "\\" && quoted)
        end += 1;
      else if (rest[end] === '"')
        quoted = !quoted;
      end += 1;
    }
    if (quoted) {
      yield null;
      return;
    }
    yield rest.slice(at, end);
    at = end;
  }
}

// work/topos-0.1.17/clean-consumer/node_modules/@lapxo/topos/dist/topos/semantic-projection.js
function semanticStandingBytes(live) {
  if (!live.length)
    throw Error("REFUSE\xB7projection empty standing");
  const lines = live.map((line) => {
    const got = parse(line, { preserveKeys: true });
    if (got.kind !== "fact")
      throw Error(`REFUSE\xB7projection ${got.why}`);
    if (got.value.fields.value === "withdraw")
      throw Error("REFUSE\xB7projection history is not standing");
    const { sig, by, epoch, expires, repo, shape, ...fields } = got.value.fields;
    if (fields.needs?.split("|").some((name) => name.startsWith("/") || name.split("/").includes("..")))
      throw Error("REFUSE\xB7projection host path is not a semantic coordinate");
    return canonical(fields, got.value.version);
  });
  return [...new Set(lines)].join("\n") + "\n";
}
function readSemanticStanding(bytes) {
  const lines = bytes.endsWith("\n") ? bytes.slice(0, -1).split("\n") : [];
  if (!lines.length || semanticStandingBytes(lines) !== bytes)
    throw Error("REFUSE\xB7projection bytes are not canonical semantic standing");
  return lines;
}

// work/bound-0.2.0/reference-native/entry.ts
function observe(bytes) {
  const sample = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  const encoded = encodeReference(sample.reference);
  if (encodeReference(decodeReference(sample.fragment)) !== sample.fragment) throw Error("REFUSE\xB7reference round trip");
  if (encoded !== sample.fragment) throw Error("REFUSE\xB7reference declaration differs");
  const refusals = [
    ["unknown class", () => encodeReference({ ...sample.reference, class: "blob" })],
    ["unknown algorithm", () => encodeReference({ ...sample.reference, algorithm: "sha512" })],
    ["duplicate or missing field", () => decodeReference(sample.fragment + "&class=standing")],
    ["profile", () => decodeReference(sample.fragment.replace("#bound:1?", "#bound:2?"))],
    ["noncanonical encoding", () => decodeReference(sample.fragment.replace("class=standing&algorithm=sha256", "algorithm=sha256&class=standing"))],
    ["source credentials or fragment", () => encodeReference({ ...sample.reference, source: "https://name:secret@example.invalid/source" })],
    ["blob integrity", () => inspectReferenceBytes({ ...sample.reference, blob: "sha256:" + "0".repeat(64) }, new TextEncoder().encode(sample.document), { maxBytes: 65536, readSemanticStanding, semanticStandingBytes, digestBytes: (bytes2) => createHash("sha256").update(bytes2).digest("hex") })]
  ];
  for (const [cause, act] of refusals) {
    let stopped = false;
    try {
      act();
    } catch (error) {
      if (!String(error).includes("REFUSE\xB7reference " + cause)) throw error;
      stopped = true;
    }
    if (!stopped) throw Error("REFUSE\xB7reference missing refusal " + cause);
  }
  const result = inspectReferenceBytes(sample.reference, new TextEncoder().encode(sample.document), { maxBytes: 65536, readSemanticStanding, semanticStandingBytes, digestBytes: (bytes2) => createHash("sha256").update(bytes2).digest("hex") });
  return [{ scope: "conformance/reference/" + sample.name, role: "writes", measure: "result", bound: { kind: "enumerated", values: [JSON.stringify({ namedRefusals: refusals.length, class: result.reference.class, digest: result.reference.digest, lines: result.lines.length, authentication: result.authentication, transport: "declared handed input; no network invocation" })] } }];
}
export {
  observe
};
