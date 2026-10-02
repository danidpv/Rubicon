import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
if (existsSync('.env')) throw new Error('.env already exists; no changes made');
const password = randomBytes(24).toString('hex');
let template = readFileSync('.env.example', 'utf8');
template = template.replace('POSTGRES_PASSWORD=\n', `POSTGRES_PASSWORD=${password}\n`).replace('DATABASE_URL=\n', `DATABASE_URL=postgresql://splocal:${password}@localhost:5432/splocal\n`).replace('SESSION_SECRET_PEPPER=\n', `SESSION_SECRET_PEPPER=${randomBytes(32).toString('hex')}\n`);
writeFileSync('.env', template, { mode: 0o600 });
process.stdout.write('Local environment created. Secrets were not printed.\n');
