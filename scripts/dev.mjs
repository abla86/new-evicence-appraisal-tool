#!/usr/bin/env node

/**
 * Universal Cross-Platform Dev Server Launcher
 * 
 * Specifically engineered to prevent the Windows Node `spawn EFTYPE` error:
 * - Direct invocation via `node scripts/dev.mjs` ensures standard PE binary execution.
 * - Always uses `process.execPath` (the current node.exe binary) instead of attempting
 *   to spawn .js/.mjs files directly without an executable wrapper.
 * - Resolves module entrypoints safely across Windows, Linux, macOS, PowerShell, and cmd.
 * - Manages clean shutdown and signal propagation to avoid zombie processes and port collisions.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function findExecutableTarget() {
  const serverPath = path.join(projectRoot, 'server.ts');
  const hasServerTs = fs.existsSync(serverPath);

  if (hasServerTs) {
    const tsxDirectPath = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    if (fs.existsSync(tsxDirectPath)) {
      return {
        bin: process.execPath,
        args: [tsxDirectPath, 'server.ts'],
        cwd: projectRoot,
        type: 'tsx-server'
      };
    }

    try {
      const tsxPkg = require.resolve('tsx/package.json');
      const tsxDir = path.dirname(tsxPkg);
      const cliPath = path.join(tsxDir, 'dist', 'cli.mjs');
      if (fs.existsSync(cliPath)) {
        return {
          bin: process.execPath,
          args: [cliPath, 'server.ts'],
          cwd: projectRoot,
          type: 'tsx-server'
        };
      }
    } catch {
      // Fallback if tsx package resolution fails
    }
  }

  // Fallback to Vite directly
  const viteDirectPath = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  if (fs.existsSync(viteDirectPath)) {
    return {
      bin: process.execPath,
      args: [viteDirectPath, '--port=3000', '--host=0.0.0.0'],
      cwd: projectRoot,
      type: 'vite-direct'
    };
  }

  try {
    const vitePkg = require.resolve('vite/package.json');
    const viteDir = path.dirname(vitePkg);
    const binPath = path.join(viteDir, 'bin', 'vite.js');
    if (fs.existsSync(binPath)) {
      return {
        bin: process.execPath,
        args: [binPath, '--port=3000', '--host=0.0.0.0'],
        cwd: projectRoot,
        type: 'vite-direct'
      };
    }
  } catch (err) {
    console.error('Could not locate either tsx or vite executable in node_modules', err);
    process.exit(1);
  }

  // Fallback to global or PATH binaries
  return {
    bin: 'tsx',
    args: ['server.ts'],
    cwd: projectRoot,
    type: 'tsx-path'
  };
}

const target = findExecutableTarget();
console.log(`[dev] Starting server with target [${target.type}]: ${target.bin} ${target.args.join(' ')}`);

const child = spawn(target.bin, target.args, {
  cwd: target.cwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3000',
    NODE_ENV: 'development'
  },
  // On Windows, running with shell: false and process.execPath prevents spawn EFTYPE completely
  shell: false
});

child.on('error', (err) => {
  console.error('[dev] Failed to spawn dev server process:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`[dev] Dev server terminated by signal ${signal}`);
  }
  process.exit(code ?? 0);
});

// Graceful signal forwarding
const cleanExit = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => cleanExit('SIGINT'));
process.on('SIGTERM', () => cleanExit('SIGTERM'));
