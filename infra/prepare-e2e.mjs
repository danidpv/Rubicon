// OneDrive placeholder files are reported as symlinks on Windows and skipped by
// Playwright discovery. Materialize a disposable local copy before each run.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
mkdirSync('.local/e2e', { recursive: true });
for (const name of readdirSync('tests/e2e').filter(n => n.endsWith('.spec.ts'))) {
  const target = `.local/e2e/${name}`;
  if (existsSync(target)) unlinkSync(target);
  writeFileSync(target, readFileSync(`tests/e2e/${name}`));
}
