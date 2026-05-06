// Patches WorkflowManager.register to handle duplicate workflow registrations
// in pnpm monorepos where @medusajs/core-flows loads from multiple virtual store paths.
// Both copies are identical (same version) so re-registration is safe to skip.
const Module = require('module');

let patched = false;
const origLoad = Module._load;

Module._load = function(request, parent, isMain) {
  const result = origLoad.apply(this, arguments);

  if (!patched && request.includes('@medusajs/orchestration') && result && result.WorkflowManager) {
    const wm = result.WorkflowManager;
    if (wm.register) {
      const originalRegister = wm.register.bind(wm);
      wm.register = function(id, ...args) {
        try {
          return originalRegister(id, ...args);
        } catch (e) {
          if (e.message && e.message.includes('already exists')) {
            return;
          }
          throw e;
        }
      };
      patched = true;
    }
  }

  return result;
};
