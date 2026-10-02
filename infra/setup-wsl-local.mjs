// Optional local verification helper. Requires PostgreSQL and Redis installed in Ubuntu WSL.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
const env = parse(readFileSync('.env'));
if (!/^[a-f0-9]+$/.test(env.POSTGRES_PASSWORD)) throw new Error('Run setup-local-env first');
const sql = `CREATE ROLE splocal LOGIN PASSWORD '${env.POSTGRES_PASSWORD}';\nCREATE DATABASE splocal OWNER splocal;\n`;
execFileSync('wsl', ['-d', 'Ubuntu', '-u', 'root', '--', 'service', 'postgresql', 'start'], { stdio: 'ignore' });
execFileSync('wsl', ['-d', 'Ubuntu', '-u', 'root', '--', 'service', 'redis-server', 'start'], { stdio: 'ignore' });
execFileSync('wsl', ['-d', 'Ubuntu', '-u', 'postgres', '--', 'psql', '-v', 'ON_ERROR_STOP=1'], { input: sql, stdio: ['pipe', 'ignore', 'ignore'] });
process.stdout.write('Local PostgreSQL database and Redis ready.\n');
