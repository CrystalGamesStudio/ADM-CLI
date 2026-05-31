const { detectOS, planInstallers, runInstallers } = require('../../src/installers');

describe('Installers planner', () => {
  test('plans brew on darwin', () => {
    const actions = planInstallers('darwin');
    expect(actions.some(a => a.name === 'brew')).toBe(true);
  });

  test('plans apt on linux', () => {
    const actions = planInstallers('linux');
    expect(actions.some(a => a.name === 'apt')).toBe(true);
  });

  test('runInstallers dry-run returns planned list', async () => {
    const res = await runInstallers({ dryRun: true, env: { ADM_PLATFORM_OVERRIDE: 'linux' } });
    expect(res.dryRun).toBe(true);
    expect(res.planned).toBeDefined();
    expect(res.planned.length).toBeGreaterThan(0);
  });
});
