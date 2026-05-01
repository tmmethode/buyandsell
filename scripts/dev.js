const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  {
    name: 'frontend',
    color: '\x1b[36m',
    command: [npmCommand, ['run', 'dev:frontend']],
  },
  {
    name: 'backend',
    color: '\x1b[33m',
    command: [npmCommand, ['run', 'dev:backend']],
  },
];

let shuttingDown = false;
const children = [];

const prefixOutput = (name, color, stream) => (chunk) => {
  const lines = chunk.toString().split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line && index === lines.length - 1) return;
    stream.write(`${color}[${name}]\x1b[0m ${line}\n`);
  });
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 100);
};

for (const processConfig of processes) {
  const [command, args] = processConfig.command;
  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  children.push(child);

  child.stdout.on('data', prefixOutput(processConfig.name, processConfig.color, process.stdout));
  child.stderr.on('data', prefixOutput(processConfig.name, processConfig.color, process.stderr));

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    if (signal) {
      process.stderr.write(`${processConfig.name} exited with signal ${signal}\n`);
      shutdown(1);
      return;
    }

    if (code !== 0) {
      process.stderr.write(`${processConfig.name} exited with code ${code}\n`);
      shutdown(code || 1);
      return;
    }

    shutdown(0);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
