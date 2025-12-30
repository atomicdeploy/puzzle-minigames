#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const BIN_PATH = fileURLToPath(new URL('./bin/console.ts', import.meta.url))

spawn('node', ['--import', 'tsx/esm', BIN_PATH, ...process.argv.slice(2)], { stdio: 'inherit' })
