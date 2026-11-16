// Shared by the page generator, the description check and the tests: tools.json is the one source.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const readJson = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
export const STATES = ['working', 'early', 'planned'];
export const DESCRIPTION_LIMIT = 350; // GitHub's cap on a repository description

// The three clauses: what goes in, what comes out, and what it is not (naming its sibling).
export const line = (t) => `In: ${t.line.in}. Out: ${t.line.out}. Not: ${t.line.not.tool}, which ${t.line.not.why}.`;

// Everything that must hold for the page to be allowed to say what it says. Returns a list of problems.
export function validate(data) {
  const bad = [];
  const names = new Set();
  const groups = new Set(data.groups.map((g) => g.id));
  for (const t of data.tools) {
    const at = `tools.${t.name}`;
    if (names.has(t.name)) bad.push(`${at}: listed twice`);
    names.add(t.name);
    if (!groups.has(t.group)) bad.push(`${at}: unknown group ${t.group}`);
    if (t.subdomain !== `${t.name}.webcli.app` || t.origin !== `https://${t.subdomain}/`) bad.push(`${at}: subdomain and origin disagree with the name`);
    if (!/^[\w.-]+\/[\w.-]+$/.test(t.repository || '')) bad.push(`${at}: repository is not owner/name`);
    if (!STATES.includes(t.state)) bad.push(`${at}: state must be one of ${STATES.join(', ')}`);
    if (t.state === 'working' && !/^https:\/\//.test(t.gates || '')) bad.push(`${at}: a working tool must link its gate table`);
    if (t.state !== 'working' && t.gates) bad.push(`${at}: only a working tool links gates`);
    if (t.state !== 'working' && !t.limits) bad.push(`${at}: a ${t.state} tool must name its limitations`);
    for (const k of ['in', 'out']) if (!t.line?.[k]) bad.push(`${at}: line.${k} is empty`);
    if (!t.line?.not?.tool || !t.line.not.why) bad.push(`${at}: line.not must name a sibling and why`);
    else if (!data.tools.some((s) => s.name === t.line.not.tool) || t.line.not.tool === t.name) bad.push(`${at}: line.not.tool must be another listed tool`);
    if (t.line && line(t).length > DESCRIPTION_LIMIT) bad.push(`${at}: the line is ${line(t).length} characters, over GitHub's ${DESCRIPTION_LIMIT}`);
  }
  return bad;
}

// Two lines are substitutable when their inputs and outputs share nearly all their words (gate I4).
const words = (s) => new Set(s.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
export function similarity(a, b) {
  const [x, y] = [words(`${a.line.in} ${a.line.out}`), words(`${b.line.in} ${b.line.out}`)];
  const both = [...x].filter((w) => y.has(w)).length;
  return both / Math.min(x.size, y.size);
}
