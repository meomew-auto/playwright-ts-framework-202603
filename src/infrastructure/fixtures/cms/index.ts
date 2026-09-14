export {
  test,
  expect,
  type CMSSuperTestFixtures,
  type CMSSuperWorkerFixtures,
  type WorkerCmsAdminSnapshot,
  type CMSAuthTestFixtures,
  type CMSAuthWorkerFixtures,
  type CMSAppFixtures,
} from './cms-super-gatekeeper.fixture';

// Backward compatibility types & aliases
export type GatekeeperFixtures = import('./cms-super-gatekeeper.fixture').CMSSuperTestFixtures;
export type AuthFixtures = import('./cms-super-gatekeeper.fixture').CMSAuthTestFixtures;
export type AppFixtures = import('./cms-super-gatekeeper.fixture').CMSAppFixtures;

export { cmsAuth as auth } from './cms-auth.fixture';
export { cmsAppFixtures as appFixtures } from './cms-app.fixture';
export { cmsAuth, CMSAuthProvider } from '@auth/cms/CMSAuthProvider';
