import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PLUGIN_VERSION } from '../../src/cli/version';

const ROOT = path.resolve(__dirname, '../..');

/**
 * Release-gate guard (gt feedback P0): an empty/mispointed tag shipped 3× because the
 * version drifted across the three files that must agree. This fails CI the moment they
 * disagree — long before a tag is cut. The tag↔files match is enforced by the
 * tag-triggered `.github/workflows/release.yml` and `scripts/release-check.sh`.
 */
describe('release version sync', () => {
  it('package.json, plugin.json and src/cli/version.ts agree on the version', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')) as { version: string };
    const manifest = JSON.parse(
      await fs.readFile(path.join(ROOT, '.claude-plugin/plugin.json'), 'utf8'),
    ) as { version: string };
    expect(PLUGIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.version).toBe(PLUGIN_VERSION);
    expect(manifest.version).toBe(PLUGIN_VERSION);
  });
});
