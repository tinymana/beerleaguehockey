import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

function imports(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] as string);
}

function offenders(folder: string, banned: RegExp): string[] {
  return files(join(SRC, folder)).flatMap((file) =>
    imports(file)
      .filter((spec) => banned.test(spec))
      .map((spec) => `${relative(SRC, file)} imports ${spec}`),
  );
}

describe('module boundaries', () => {
  it('core depends on nothing', () => {
    expect(offenders('core', /phaser|\/(match|dynasty|lifestyle|app)\//)).toEqual([]);
  });

  it('match simulation never touches Phaser, the DOM layer or other modules', () => {
    expect(offenders('match/sim', /phaser|\/(view|dynasty|lifestyle|app)\//)).toEqual([]);
  });

  it('match never reaches into app, dynasty or lifestyle', () => {
    expect(offenders('match', /\/(dynasty|lifestyle|app)\//)).toEqual([]);
  });

  it('simulation code uses no wall clock or unseeded randomness', () => {
    const bad = [...files(join(SRC, 'core')), ...files(join(SRC, 'match', 'sim'))].filter((file) =>
      /Math\.random|Date\.now|performance\.now|new Date\(/.test(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')),
    );
    expect(bad.map((f) => relative(SRC, f))).toEqual([]);
  });
});
