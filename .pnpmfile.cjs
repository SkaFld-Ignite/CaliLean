function readPackage(pkg, context) {
  // Force all @medusajs packages to use consistent peer deps
  // This prevents pnpm from creating duplicate virtual store entries
  // for @medusajs/core-flows with different peer dep contexts
  if (pkg.name && pkg.name.startsWith('@medusajs/') && pkg.peerDependencies) {
    if (pkg.peerDependencies['@medusajs/framework']) {
      pkg.peerDependencies['@medusajs/framework'] = '2.14.1';
    }
    if (pkg.peerDependencies['@medusajs/orchestration']) {
      pkg.peerDependencies['@medusajs/orchestration'] = '2.14.1';
    }
    if (pkg.peerDependencies['@medusajs/workflows-sdk']) {
      pkg.peerDependencies['@medusajs/workflows-sdk'] = '2.14.1';
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
