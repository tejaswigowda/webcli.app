#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, readJson } from './lib.mjs';

const REQUIRED_FIELDS = ['kind', 'id', 'version', 'live', 'repo', 'licence', 'agent', 'boundary', 'measured'];
const MEASUREMENT_STATES = ['measured', 'partial', 'pending'];
const EXTRA_GROUPS = [
  { id: 'file-transfer', title: 'File transfer' },
  { id: 'games', title: 'Games' },
  { id: 'calls', title: 'Calls' },
];

function scalar(value) {
  if (value.startsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  return value;
}

export function parseToolPage(file, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const lines = match[1].split(/\r?\n/);
  const metadata = {};
  for (let i = 0; i < lines.length; i++) {
    const field = lines[i].match(/^([a-z][a-z0-9_-]*):(?:\s*(.*))?$/);
    if (!field) throw new Error(`${file}: invalid front matter at line ${i + 1}`);
    const [, key, value = ''] = field;
    if (Object.hasOwn(metadata, key)) throw new Error(`${file}: duplicate front matter field "${key}"`);
    if (key === 'details' && value === '|') {
      const block = [];
      while (i + 1 < lines.length && (/^ {2}/.test(lines[i + 1]) || lines[i + 1] === '')) {
        i++;
        block.push(lines[i].startsWith('  ') ? lines[i].slice(2) : '');
      }
      try {
        metadata.details = JSON.parse(block.join('\n'));
      } catch (error) {
        throw new Error(`${file}: details must be valid JSON (${error.message})`);
      }
    } else {
      metadata[key] = scalar(value);
    }
  }
  return metadata;
}

export function validateToolPage(metadata, file) {
  const problems = [];
  const label = file || metadata.id || 'tool page';
  for (const field of REQUIRED_FIELDS) {
    if (metadata[field] === undefined || metadata[field] === null || metadata[field] === '') {
      problems.push(`${label}: missing required front matter field "${field}"`);
    }
  }
  if (metadata.kind !== undefined && !['tool', 'library'].includes(metadata.kind)) {
    problems.push(`${label}: kind must be "tool" or "library"`);
  }
  if (metadata.version !== undefined && typeof metadata.version !== 'string') {
    problems.push(`${label}: version must be a string`);
  }
  if (metadata.live !== undefined && metadata.live !== 'none' && (typeof metadata.live !== 'string' || !/^https:\/\//.test(metadata.live))) {
    problems.push(`${label}: live must be an https URL or "none"`);
  }
  if (metadata.repo !== undefined && (typeof metadata.repo !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(metadata.repo))) {
    problems.push(`${label}: repo must be a GitHub repository URL`);
  }
  if (metadata.licence !== undefined && typeof metadata.licence !== 'string') {
    problems.push(`${label}: licence must be a string`);
  }
  if (metadata.agent !== undefined && typeof metadata.agent !== 'boolean') {
    problems.push(`${label}: agent must be a boolean`);
  }
  if (metadata.boundary !== undefined && (typeof metadata.boundary !== 'string' || !metadata.boundary.trim())) {
    problems.push(`${label}: boundary must be a non-empty string`);
  }
  if (metadata.measured !== undefined && !MEASUREMENT_STATES.includes(metadata.measured)) {
    problems.push(`${label}: measured must be one of ${MEASUREMENT_STATES.join(', ')}`);
  }
  if (metadata.details === undefined || !metadata.details || typeof metadata.details !== 'object' || Array.isArray(metadata.details)) {
    problems.push(`${label}: missing or invalid front matter field "details"`);
  } else if (metadata.kind === 'tool' && (!metadata.details.line || !metadata.details.state || !metadata.details.group)) {
    problems.push(`${label}: tool details must include line, state, and group`);
  } else if (metadata.kind === 'library' && !metadata.details.description) {
    problems.push(`${label}: library details must include description`);
  }
  return problems;
}

function entryFromPage(metadata, file) {
  const problems = validateToolPage(metadata, file);
  if (problems.length) throw new Error(problems.join('\n'));
  const { kind, id, version, live, repo, licence, agent, boundary, measured, details } = metadata;
  const entry = {
    ...details,
    kind,
    id,
    version,
    live,
    repo,
    licence,
    agent,
    boundary,
    measured,
    page: kind === 'tool'
      ? `/#tool-${details.name || id.replace(/-webcli$/i, '').toLowerCase()}`
      : `/#library-${id}`,
  };
  if (kind === 'tool') {
    const { kind: outputKind, ...toolDetails } = details;
    Object.assign(entry, toolDetails, {
      kind,
      id,
      name: details.name || id.replace(/-webcli$/i, '').toLowerCase(),
      version,
      live,
      repo,
      repository: repo.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, ''),
      origin: live === 'none' ? null : live,
      subdomain: live === 'none' ? null : new URL(live).host,
      licence,
      agent,
      boundary,
      measured,
      page: `/#tool-${details.name || id.replace(/-webcli$/i, '').toLowerCase()}`,
    });
    if (outputKind !== undefined) entry.output_kind = outputKind;
  }
  return entry;
}

export function readToolPages(directory = path.join(ROOT, 'tool-pages')) {
  const files = readdirSync(directory)
    .filter((name) => /^tool-[\w.-]+\.md$/.test(name))
    .sort();
  const entries = files.map((name) => {
    const file = path.join(directory, name);
    const metadata = parseToolPage(name, readFileSync(file, 'utf8'));
    const expectedSlug = name.slice(0, -3);
    if (metadata.slug !== expectedSlug) throw new Error(`${name}: slug must be "${expectedSlug}"`);
    return entryFromPage(metadata, name);
  });
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new Error(`${entry.page}: duplicate id "${entry.id}"`);
    ids.add(entry.id);
  }
  if (!entries.length) throw new Error('no tool pages found in tool-pages/');
  return entries;
}

export function buildManifest() {
  const current = readJson('tools.json');
  const entries = readToolPages();
  const tools = entries.filter((entry) => entry.kind === 'tool');
  const libraries = entries.filter((entry) => entry.kind === 'library');
  const groups = [...current.groups];
  for (const group of EXTRA_GROUPS) {
    if (tools.some((tool) => tool.group === group.id) && !groups.some((existing) => existing.id === group.id)) groups.push(group);
  }
  return {
    ...current,
    schema: 4,
    about: 'Generated from each pages/tool-*.md front matter; tools and libraries are separated by kind.',
    groups,
    tools,
    libraries,
  };
}

export function writeManifest() {
  const manifest = buildManifest();
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(path.join(ROOT, 'tools.json'), json);
  const wellKnown = {
    schema: manifest.schema,
    family: manifest.family,
    site: manifest.site,
    updated: manifest.updated,
    tools: manifest.tools,
    libraries: manifest.libraries,
  };
  const wellKnownPath = path.join(ROOT, '.well-known');
  mkdirSync(wellKnownPath, { recursive: true });
  writeFileSync(path.join(wellKnownPath, 'webcli.json'), `${JSON.stringify(wellKnown, null, 2)}\n`);
  return manifest;
}
