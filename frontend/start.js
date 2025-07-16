#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const reactScriptsPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  'react-scripts'
);

const child = spawn('node', [reactScriptsPath, 'start'], {
  stdio: 'inherit',
  env: { ...process.env, BROWSER: 'none', PORT: '3000' },
});

child.on('error', (error) => {
  console.error('Error starting development server:', error);
});

child.on('exit', (code) => {
  console.log(`Development server exited with code ${code}`);
});
