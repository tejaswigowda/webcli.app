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
  const entryIds = new Set();
  for (const t of data.tools) {
    const at = `tools.${t.id || t.name}`;
    if (names.has(t.name)) bad.push(`${at}: listed twice`);
    names.add(t.name);
    if (entryIds.has(t.id)) bad.push(`${at}: id is listed twice`);
    entryIds.add(t.id);
    if (t.kind !== 'tool') bad.push(`${at}: kind must be tool`);
    if (!groups.has(t.group)) bad.push(`${at}: unknown group ${t.group}`);
    if (t.live !== 'none' && !/^https:\/\//.test(t.live || '')) bad.push(`${at}: live must be an https URL or none`);
    if ((t.live === 'none' && t.origin !== null) || (t.live !== 'none' && t.origin !== t.live)) bad.push(`${at}: origin must agree with live`);
    if (!/^[\w.-]+\/[\w.-]+$/.test(t.repository || '') || t.repo !== `https://github.com/${t.repository}`) bad.push(`${at}: repository and repo URL disagree`);
    if (!t.version) bad.push(`${at}: version is required`);
    if (!t.licence) bad.push(`${at}: licence is required`);
    if (typeof t.agent !== 'boolean') bad.push(`${at}: agent must be a boolean`);
    if (!t.boundary) bad.push(`${at}: boundary is required`);
    if (!['measured', 'partial', 'pending'].includes(t.measured)) bad.push(`${at}: measured must be measured, partial, or pending`);
    if (!STATES.includes(t.state)) bad.push(`${at}: state must be one of ${STATES.join(', ')}`);
    if (t.state === 'working' && !/^https:\/\//.test(t.gates || '')) bad.push(`${at}: a working tool must link its gate table`);
    if (t.state !== 'working' && t.gates) bad.push(`${at}: only a working tool links gates`);
    if (t.state !== 'working' && !t.limits) bad.push(`${at}: a ${t.state} tool must name its limitations`);
    for (const k of ['in', 'out']) if (!t.line?.[k]) bad.push(`${at}: line.${k} is empty`);
    if (!t.line?.not?.tool || !t.line.not.why) bad.push(`${at}: line.not must name a sibling and why`);
    else if (t.line.not.tool === t.name) bad.push(`${at}: line.not.tool must name a sibling`);
    if (t.line && line(t).length > DESCRIPTION_LIMIT) bad.push(`${at}: the line is ${line(t).length} characters, over GitHub's ${DESCRIPTION_LIMIT}`);
  }
  for (const library of data.libraries || []) {
    const at = `libraries.${library.id}`;
    if (library.kind !== 'library') bad.push(`${at}: kind must be library`);
    if (entryIds.has(library.id)) bad.push(`${at}: id is listed twice`);
    entryIds.add(library.id);
    for (const field of ['version', 'licence', 'boundary', 'measured', 'description']) {
      if (!library[field]) bad.push(`${at}: ${field} is required`);
    }
    if (library.live !== 'none' && !/^https:\/\//.test(library.live || '')) bad.push(`${at}: live must be an https URL or none`);
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(library.repo || '')) bad.push(`${at}: repo must be a GitHub repository URL`);
    if (typeof library.agent !== 'boolean') bad.push(`${at}: agent must be a boolean`);
    if (!['measured', 'partial', 'pending'].includes(library.measured)) bad.push(`${at}: measured must be measured, partial, or pending`);
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
