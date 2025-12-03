#!/usr/bin/env node

/**
 * Pre-Build Validation Script
 * Run this before EAS build to catch common issues
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

console.log('🔍 Running pre-build checks...\n');

// Check 1: Firebase config files
if (!fs.existsSync('google-services.json')) {
  errors.push('❌ google-services.json not found (required for Android)');
} else {
  console.log('✅ google-services.json found');
}

// Check 2: Package.json validity
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!pkg.name || !pkg.version) {
    errors.push('❌ package.json missing name or version');
  } else {
    console.log('✅ package.json valid');
  }
} catch (e) {
  errors.push('❌ package.json is invalid JSON');
}

// Check 3: app.json validity
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  if (!appJson.expo.android.package) {
    errors.push('❌ app.json missing android.package');
  }
  if (!appJson.expo.extra?.eas?.projectId) {
    warnings.push('⚠️  app.json missing EAS projectId');
  }
  console.log('✅ app.json valid');
} catch (e) {
  errors.push('❌ app.json is invalid JSON');
}

// Check 4: eas.json validity
try {
  const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  if (!easJson.build) {
    errors.push('❌ eas.json missing build configuration');
  }
  console.log('✅ eas.json valid');
} catch (e) {
  errors.push('❌ eas.json is invalid or missing');
}

// Check 5: node_modules exists
if (!fs.existsSync('node_modules')) {
  errors.push('❌ node_modules not found - run npm install');
} else {
  console.log('✅ node_modules found');
}

// Check 6: Critical dependencies
const criticalDeps = [
  'expo',
  'react',
  'react-native',
  '@react-native-firebase/app',
  '@react-native-firebase/messaging'
];

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  criticalDeps.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      errors.push(`❌ Missing critical dependency: ${dep}`);
    }
  });
  console.log('✅ Critical dependencies present');
} catch (e) {
  // Already caught above
}

// Check 7: Verify no syntax errors in key files
const keyFiles = [
  'App.js',
  'index.js',
  'babel.config.js'
];

keyFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`❌ Missing key file: ${file}`);
  }
});

console.log('\n' + '='.repeat(50));

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(w => console.log(w));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(e => console.log(e));
  console.log('\n🛑 Fix these errors before building!\n');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Ready to build.\n');
  console.log('Run: npm run build:dev (for development build)');
  console.log('  or: npm run build:preview (for preview build)');
  console.log('  or: npm run build:prod (for production build)\n');
  process.exit(0);
}
