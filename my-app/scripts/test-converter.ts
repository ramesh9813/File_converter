import fs from 'fs/promises';
import path from 'path';
import { convertFile } from '../lib/converter';

async function testMD() {
  const input = 'test.md';
  const output = 'test.html';
  await fs.writeFile(input, '# Hello World');
  await convertFile(input, output, 'html', 'md');
  const content = await fs.readFile(output, 'utf-8');
  if (content.includes('<h1>Hello World</h1>')) {
    console.log('MD -> HTML Passed');
  } else {
    console.error('MD -> HTML Failed', content);
  }
  await fs.unlink(input);
  await fs.unlink(output);
}

async function testJSON() {
  const input = 'test.json';
  const output = 'test.yaml';
  await fs.writeFile(input, '{"hello": "world"}');
  await convertFile(input, output, 'yaml', 'json');
  const content = await fs.readFile(output, 'utf-8');
  if (content.includes('hello: world')) {
    console.log('JSON -> YAML Passed');
  } else {
    console.error('JSON -> YAML Failed', content);
  }
  await fs.unlink(input);
  await fs.unlink(output);
}

async function main() {
  try {
    await testMD();
    await testJSON();
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

main();
