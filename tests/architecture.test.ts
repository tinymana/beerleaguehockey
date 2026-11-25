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

  it('arena layout, wear, registry and config stay free of Phaser so they can be tested headless', () => {
    const pure = ['layout.ts', 'iceWear.ts', 'registry.ts', 'config.ts'].map((f) => join(SRC, 'match', 'view', 'arena', f));
    expect(pure.filter((f) => /from 'phaser'/.test(readFileSync(f, 'utf8'))).map((f) => relative(SRC, f))).toEqual([]);
  });

  it('dynasty never touches Phaser, the screen layer, the match internals or lifestyle', () => {
    expect(offenders('dynasty', /phaser|\/(app|lifestyle|match\/view|match\/sim)\//)).toEqual([]);
  });

  it('simulation code uses no wall clock or unseeded randomness', () => {
    const bad = [...files(join(SRC, 'core')), ...files(join(SRC, 'match', 'sim')), ...files(join(SRC, 'dynasty'))].filter((file) =>
      /Math\.random|Date\.now|performance\.now|new Date\(/.test(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')),
    );
    expect(bad.map((f) => relative(SRC, f))).toEqual([]);
  });
});
