/**
 * Copies Prydox-specific overrides into @aave/deploy-v3 after npm install.
 * (patch-package can fail on Windows due to long paths under node_modules.)
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const patchHelpers = path.join(root, "patches", "@aave-deploy-v3", "dist", "helpers");
const destHelpers = path.join(root, "node_modules", "@aave", "deploy-v3", "dist", "helpers");

const helperFiles = ["init-helpers.js", "market-config-helpers.js", "constants.js"];

const patchTreasury = path.join(
  root,
  "patches",
  "@aave-deploy-v3",
  "dist",
  "deploy",
  "01_periphery_pre",
  "01_treasury.js"
);
const destTreasury = path.join(
  root,
  "node_modules",
  "@aave",
  "deploy-v3",
  "dist",
  "deploy",
  "01_periphery_pre",
  "01_treasury.js"
);

function main() {
  if (!fs.existsSync(destHelpers)) {
    console.warn(
      "[prydox-aave-patches] skip: @aave/deploy-v3 not installed yet (run npm install in contracts/)."
    );
    return;
  }
  for (const f of helperFiles) {
    const src = path.join(patchHelpers, f);
    const dest = path.join(destHelpers, f);
    if (!fs.existsSync(src)) {
      console.warn(`[prydox-aave-patches] missing patch file: ${src}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log(`[prydox-aave-patches] applied ${f}`);
  }
  if (fs.existsSync(patchTreasury) && fs.existsSync(path.dirname(destTreasury))) {
    fs.copyFileSync(patchTreasury, destTreasury);
    console.log("[prydox-aave-patches] applied 01_periphery_pre/01_treasury.js");
  }

  const deployPatches = [
    ["02_market/01a_pool_implementation.js", "01a_pool_implementation.js"],
    ["02_market/02_pool_configurator.js", "02_pool_configurator.js"],
    ["02_market/08_tokens_implementations.js", "08_tokens_implementations.js"],
    ["03_periphery_post/01_native_token_gateway.js", "01_native_token_gateway.js"],
  ];
  const deployRoot = path.join(root, "patches", "@aave-deploy-v3", "dist", "deploy");
  const destDeploy = path.join(root, "node_modules", "@aave", "deploy-v3", "dist", "deploy");
  for (const [rel, label] of deployPatches) {
    const src = path.join(deployRoot, rel);
    const dst = path.join(destDeploy, rel);
    if (fs.existsSync(src) && fs.existsSync(path.dirname(dst))) {
      fs.copyFileSync(src, dst);
      console.log(`[prydox-aave-patches] applied ${label}`);
    }
  }
}

main();
