// Monorepo-aware Metro config for pnpm.
// - watchFolders lets Metro pick up file changes in workspace siblings (@lio/core)
// - nodeModulesPaths + disableHierarchicalLookup avoids pnpm's symlink resolution surprises
// - NativeWind wrapper pipes tailwind through Metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// Leave hierarchical lookup ENABLED so Metro can walk up parent node_modules
// (including into pnpm's .pnpm/ virtual store) when a package has a dep at
// a different version than the one hoisted to workspace root — e.g. semver
// v7 needed by react-native-reanimated when v6 got hoisted by something else.
// Honor the "exports" field in @lio/core/package.json so `@lio/core/schemas/auth`
// resolves to `packages/core/src/schemas/auth.ts` at bundle time. Metro 0.82+
// enables this by default; keep the flag as a safety net.
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });
