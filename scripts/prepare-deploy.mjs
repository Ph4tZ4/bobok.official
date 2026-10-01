import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const required = ['index.html', 'admin/index.html', 'api/index.php', '.htaccess'];
for (const file of required) await access(path.join('dist', file));

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Symlink not allowed: ${file}`);
    assert.ok(!/^(\.git|\.env|SSH$|node_modules$|config.*\.php$)|\.(sql|pem|key|pub)$/i.test(entry.name), `Unexpected deploy file: ${file}`);
    if (entry.isDirectory()) await inspect(file);
    else {
      const content = await readFile(file);
      assert.ok(!/-----BEGIN (?:OPENSSH |RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(content.toString()), `Private key in artifact: ${file}`);
    }
  }
}
await inspect('dist');
await writeFile('dist/deployment.json', JSON.stringify({
  sha: process.env.GITHUB_SHA || 'local-poc',
  run: `${process.env.GITHUB_RUN_ID || 'local'}-${process.env.GITHUB_RUN_ATTEMPT || '1'}`,
}) + '\n');
console.log('Deploy artifact verified; release marker written.');
