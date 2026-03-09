#!/usr/bin/env node
/**
 * Invoke the resume parser (resume_to_flock.py) with a given resume.docx path.
 * Usage:
 *   node scripts/run-parse-resume.mjs --docx <path-to.docx> [--out <output-dir>] [--id <id>] [--force]
 *   Or set RESUME_PARSER_PATH (default: ../../workspace-resume/resume-parser).
 * If --id is given, --out defaults to parsed_resumes/<id> (resume-flock repo).
 * If output dir already has jobs (jobs/jobs.mjs or jobs.mjs), exit unless --force.
 */
import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PARSED_RESUMES_DIR = path.join(PROJECT_ROOT, 'parsed_resumes');

const PARSER_SCRIPT = 'resume_to_flock.py';
const DEFAULT_PARSER_PATH = path.resolve(PROJECT_ROOT, '..', '..', 'workspace-resume', 'resume-parser');
const TIMEOUT_MS = 120_000;

function printHelp() {
  console.log(`
Parse a resume .docx into a parsed-resume folder (jobs/jobs.mjs, skills/skills.mjs, resume.docx).

Usage:
  npm run parse-resume -- --docx <path-to.docx> (--id <id> | --out <dir>) [--force]

  (Use "--" so npm passes --docx/--id to the script, not to npm.)

Required:
  --docx <path>   Path to the resume .docx file to parse.

Output (exactly one):
  --id <id>       Output folder will be parsed_resumes/<id>. Example: --id my-2025-resume
  --out <dir>     Exact output directory. (If both --id and --out are given, --out wins.)

Options:
  --force         Overwrite output dir if it already contains jobs (default: exit with error).
  --help, -h      Show this help.

Environment:
  RESUME_PARSER_PATH  Path to the Python parser (default: ../../workspace-resume/resume-parser).

Example:
  npm run parse-resume -- --docx ~/Documents/resume.docx --id my-resume

After a successful run, set app_state.json user-settings.currentResumeId to the --id value
to use this parsed resume in the app.
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { docx: null, out: null, id: null, force: false, help: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
      out.help = true;
    } else if (args[i] === '--docx' && args[i + 1]) {
      out.docx = path.resolve(process.cwd(), args[++i]);
    } else if (args[i] === '--out' && args[i + 1]) {
      out.out = path.resolve(process.cwd(), args[++i]);
    } else if (args[i] === '--id' && args[i + 1]) {
      out.id = args[++i];
    } else if (args[i] === '--force') {
      out.force = true;
    }
  }
  if (out.id && !out.out) {
    out.out = path.join(PARSED_RESUMES_DIR, out.id);
  }
  return out;
}

async function outputDirHasJobs(outDir) {
  try {
    await fs.access(path.join(outDir, 'jobs', 'jobs.mjs'));
    return true;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  try {
    await fs.access(path.join(outDir, 'jobs.mjs'));
    return true;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return false;
}

async function main() {
  const { docx, out: outDir, id, force, help } = parseArgs();
  if (help || (!docx && process.argv.length <= 2)) {
    printHelp();
    process.exit(help || !docx ? 0 : 1);
  }
  if (!docx) {
    console.error('Missing --docx. Run with --help for usage.');
    process.exit(1);
  }
  if (!outDir) {
    console.error('Provide either --out <dir> or --id <id>. Run with --help for usage.');
    process.exit(1);
  }

  const hasExisting = await outputDirHasJobs(outDir);
  if (hasExisting && !force) {
    console.error('Output dir already contains jobs (jobs/jobs.mjs or jobs.mjs). Use --force to overwrite.');
    process.exit(1);
  }

  try {
    await fs.access(docx);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error('Docx file not found:', docx);
      process.exit(1);
    }
    throw e;
  }

  const parserPath = process.env.RESUME_PARSER_PATH
    ? path.resolve(process.cwd(), process.env.RESUME_PARSER_PATH)
    : DEFAULT_PARSER_PATH;
  const scriptPath = path.join(parserPath, PARSER_SCRIPT);
  let pythonBin = 'python3';
  for (const venvDir of ['venv']) {
    try {
      const venvPython = path.join(parserPath, venvDir, 'bin', 'python');
      await fs.access(venvPython);
      pythonBin = venvPython;
      break;
    } catch {}
  }
  try {
    await fs.access(scriptPath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error('Parser not found:', scriptPath);
      console.error('Expected a directory containing resume_to_flock.py.');
      console.error('Default is ../../workspace-resume/resume-parser (relative to resume-flock).');
      console.error('Set RESUME_PARSER_PATH to your parser directory, e.g.:');
      console.error('  export RESUME_PARSER_PATH=/path/to/resume-parser');
      console.error('  npm run parse-resume -- --docx file.docx --id my-resume');
      process.exit(1);
    }
    throw e;
  }

  await fs.mkdir(outDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [scriptPath, docx, '-o', outDir], {
      cwd: parserPath,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    const t = setTimeout(() => {
      child.kill('SIGTERM');
      console.error('Parser timed out after', TIMEOUT_MS / 1000, 's');
      reject(new Error('Parser timeout'));
    }, TIMEOUT_MS);
    child.on('error', (err) => {
      clearTimeout(t);
      console.error('Failed to start parser:', err.message);
      reject(err);
    });
    child.on('close', (code, signal) => {
      clearTimeout(t);
      if (code === 0) {
        console.log('Parser wrote output to:', outDir);
        if (id) {
          console.log('To use in resume-flock, set app_state.json user-settings.currentResumeId to:', JSON.stringify(id));
        }
        resolve();
      } else {
        reject(new Error(`Parser exited with code ${code}${signal ? ` signal ${signal}` : ''}`));
      }
    });
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
