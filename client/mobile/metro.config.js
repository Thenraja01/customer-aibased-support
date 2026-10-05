const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 1. Find the project root
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// 2. Limit watchFolders and node_modules to the mobile project directory
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Prevent Metro from trying to resolve nonexistent workspace parent node_modules
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
