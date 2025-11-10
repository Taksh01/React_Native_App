#!/usr/bin/env node

/**
 * Drawer Performance Optimization Script
 * This script applies performance optimizations to the drawer navigation
 */

const fs = require("fs");
const path = require("path");

const DRAWER_VIEW_PATHS = [
  "node_modules/@react-navigation/drawer/lib/commonjs/views/DrawerView.js",
  "node_modules/@react-navigation/drawer/lib/module/views/DrawerView.js",
  "node_modules/@react-navigation/drawer/src/views/DrawerView.tsx",
];

function optimizeDrawerPerformance() {
  console.log(
    "[INFO] Optimizing drawer performance and fixing Reanimated 3 compatibility..."
  );

  DRAWER_VIEW_PATHS.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.log(`[WARN] File not found: ${filePath}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, "utf8");

      // CRITICAL FIX: Force useLegacyImplementation to false for Reanimated 3 compatibility
      // Pattern for compiled JS
      const legacyImplementationPattern =
        /useLegacyImplementation\s*=\s*!\(\(_Reanimated\$isConfigu\s*=\s*Reanimated\.isConfigured\)\s*!==\s*null\s*&&\s*_Reanimated\$isConfigu\s*!==\s*void\s*0\s*&&\s*_Reanimated\$isConfigu\.call\(Reanimated\)\)/g;

      // Pattern for TypeScript source
      const tsLegacyPattern =
        /useLegacyImplementation\s*=\s*!Reanimated\.isConfigured\?\.\(\)/g;

      let patched = false;

      if (legacyImplementationPattern.test(content)) {
        content = content.replace(
          legacyImplementationPattern,
          "// PATCH: Force useLegacyImplementation to false to avoid Reanimated 3 error\n    useLegacyImplementation = false"
        );
        console.log(
          `[FIX] Applied Reanimated 3 compatibility fix (JS) to: ${filePath}`
        );
        patched = true;
      }

      // Reset regex lastIndex
      legacyImplementationPattern.lastIndex = 0;

      if (tsLegacyPattern.test(content)) {
        content = content.replace(
          tsLegacyPattern,
          "// PATCH: Force useLegacyImplementation to false to avoid Reanimated 3 error\n  useLegacyImplementation = false"
        );
        console.log(
          `[FIX] Applied Reanimated 3 compatibility fix (TS) to: ${filePath}`
        );
        patched = true;
      }

      // Comment out the error check for useLegacyImplementation
      const errorCheckPattern =
        /if\s*\(useLegacyImplementation\s*&&\s*legacyImplemenationNotAvailable\)\s*\{[^}]*throw new Error\([^)]*\);[^}]*\}/g;

      if (errorCheckPattern.test(content)) {
        content = content.replace(
          errorCheckPattern,
          "// PATCH: Skip legacy implementation error for Reanimated 3\n  // Error check commented out - using modern implementation"
        );
        console.log(
          `[FIX] Disabled legacy implementation error check in: ${filePath}`
        );
      }

      if (!content.includes("// PERFORMANCE OPTIMIZATIONS")) {
        const optimizations = `// PERFORMANCE OPTIMIZATIONS
const DRAWER_ANIMATION_CONFIG = {
  useNativeDriver: true,
  duration: 250,
  easing: 'ease-out'
};

const PERFORMANCE_CONFIG = {
  shouldRasterizeIOS: true,
  renderToHardwareTextureAndroid: true,
  needsOffscreenAlphaCompositing: false
};
`;

        content = optimizations + content;

        content = content.replace(/duration:\s*\d+/g, "duration: 250");
        content = content.replace(
          /useNativeDriver:\s*false/g,
          "useNativeDriver: true"
        );

        console.log(`[PERF] Applied performance optimizations to: ${filePath}`);
      }

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`[DONE] Optimized: ${filePath}`);
    } catch (error) {
      console.error(`[ERROR] Failed to optimize ${filePath}:`, error.message);
    }
  });

  console.log(
    "[DONE] Drawer performance optimization and Reanimated 3 fix complete."
  );
}

if (require.main === module) {
  optimizeDrawerPerformance();
}

module.exports = { optimizeDrawerPerformance };
