/**
 * Transform TypeScript files to JavaScript
 * Removes type annotations and converts file extensions
 */

/**
 * Strip TypeScript type annotations from code and fix imports for JavaScript
 * @param {string} content - TypeScript file content
 * @returns {string} - JavaScript content
 */
export function stripTypeScript(content) {
  let jsContent = content;

  // Remove type imports
  jsContent = jsContent.replace(/^import\s+type\s+.*?;?\s*$/gm, '');
  
  // Remove type-only imports from regular imports
  jsContent = jsContent.replace(/,\s*type\s+\{[^}]+\}/g, '');
  jsContent = jsContent.replace(/import\s+\{[^}]*type\s+[^}]*\}/g, (match) => {
    return match.replace(/,?\s*type\s+\w+/g, '').replace(/\{\s*,/, '{').replace(/,\s*\}/, '}');
  });

  // Remove interface declarations
  jsContent = jsContent.replace(/^export\s+interface\s+\w+\s*\{[^}]*\}\s*$/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+\s*\{[^}]*\}\s*$/gm, '');

  // Remove type aliases
  jsContent = jsContent.replace(/^export\s+type\s+\w+\s*=\s*[^;]+;\s*$/gm, '');
  jsContent = jsContent.replace(/^type\s+\w+\s*=\s*[^;]+;\s*$/gm, '');

  // Remove parameter types: (param: Type) => (param)
  jsContent = jsContent.replace(/\(\s*(\w+)\s*:\s*[^,)]+/g, '($1');
  jsContent = jsContent.replace(/,\s*(\w+)\s*:\s*[^,)]+/g, ', $1');
  
  // Remove return types: ): Type => ): void => ()
  jsContent = jsContent.replace(/\)\s*:\s*[^{=>\n]+\s*=>/g, ') =>');
  jsContent = jsContent.replace(/\)\s*:\s*[^{=>\n]+\s*\{/g, ') {');
  
  // Remove variable type annotations: const x: Type = ... => const x = ...
  jsContent = jsContent.replace(/:\s*[^=\n]+(?=\s*=)/g, '');
  
  // Remove function return types
  jsContent = jsContent.replace(/function\s+(\w+)\s*\([^)]*\)\s*:\s*[^{]+\{/g, 'function $1($2) {');
  
  // Remove as type assertions
  jsContent = jsContent.replace(/\s+as\s+\w+/g, '');
  
  // Remove angle bracket type assertions: <Type>value => value
  jsContent = jsContent.replace(/<\w+>/g, '');
  
  // Remove ! non-null assertions
  jsContent = jsContent.replace(/(\w+)!/g, '$1');
  
  // Remove ? optional chaining that's TypeScript specific
  // Keep ?. and ?? as they're valid JS
  
  // Remove generic type parameters
  jsContent = jsContent.replace(/<[^>]+>/g, '');
  
  // Remove enum declarations (convert to object)
  jsContent = jsContent.replace(/enum\s+(\w+)\s*\{([^}]+)\}/g, (match, name, body) => {
    const entries = body.split(',').map(e => e.trim()).filter(Boolean);
    const obj = entries.map(e => {
      const [key, value] = e.split('=').map(s => s.trim());
      return value ? `  ${key}: ${value}` : `  ${key}: "${key}"`;
    }).join(',\n');
    return `const ${name} = {\n${obj}\n}`;
  });

  // Fix import paths for Node.js ESM
  // 1. Replace TypeScript alias @/ with Node.js native #/
  jsContent = jsContent.replace(/from\s+["']@\//g, 'from "#/');
  jsContent = jsContent.replace(/import\s*\(\s*["']@\//g, 'import("#/');
  jsContent = jsContent.replace(/require\s*\(\s*["']@\//g, 'require("#/');
  
  // 2. Add .js extension to #/ imports (they're now pointing to .js files)
  jsContent = jsContent.replace(/from\s+["']#\/([^"']+)["']/g, (match, path) => {
    // Don't add .js if it already has an extension or is a directory import
    if (path.endsWith('.js') || path.endsWith('.json') || path.endsWith('/')) {
      return match;
    }
    return `from "#/${path}.js"`;
  });
  
  // 3. Add .js extension to relative imports
  jsContent = jsContent.replace(/from\s+["'](\.\.?\/[^"']+)["']/g, (match, path) => {
    // Don't add .js if it already has an extension
    if (path.match(/\.\w+$/)) {
      return match;
    }
    return `from "${path}.js"`;
  });

  // Remove multiple consecutive blank lines
  jsContent = jsContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  return jsContent;
}

/**
 * Get JavaScript package.json scripts
 * @returns {Object} - Scripts for JavaScript project
 */
export function getJavaScriptScripts() {
  return {
    dev: "nodemon --exec node src/server.js",
    start: "node src/server.js",
    lint: 'eslint "src/**/*.js"',
    format: 'prettier --write "src/**/*.{js,json}"',
    "check-format": 'prettier --check "src/**/*.{js,json}"',
    prepare: "husky"
  };
}

/**
 * Get JavaScript dependencies (remove TS-specific ones)
 * @param {Object} originalDeps - Original TypeScript dependencies
 * @param {Object} originalDevDeps - Original TypeScript devDependencies
 * @returns {Object} - { dependencies, devDependencies }
 */
export function getJavaScriptDependencies(originalDeps, originalDevDeps) {
  // Remove TypeScript-specific packages
  const tsPackages = [
    'typescript',
    'ts-node-dev',
    'tsconfig-paths',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser'
  ];

  const typePackages = Object.keys(originalDevDeps).filter(pkg => pkg.startsWith('@types/'));

  const devDeps = { ...originalDevDeps };
  
  // Remove TS packages
  [...tsPackages, ...typePackages].forEach(pkg => {
    delete devDeps[pkg];
  });

  // Add nodemon for JS development
  devDeps.nodemon = '^3.0.2';

  return {
    dependencies: { ...originalDeps },
    devDependencies: devDeps
  };
}

/**
 * Get package.json imports field for Node.js native path aliasing
 * This replaces TypeScript's tsconfig paths with Node's native imports
 * @returns {Object} - imports configuration
 */
export function getNodeImportsConfig() {
  return {
    "#/*": "./src/*"
  };
}

import fs from 'fs';
import path from 'path';

/**
 * Transform a single TypeScript file to JavaScript
 * @param {string} filePath - Path to .ts file
 */
function transformFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const jsContent = stripTypeScript(content);
  
  // Write to .js file
  const jsFilePath = filePath.replace(/\.ts$/, '.js');
  fs.writeFileSync(jsFilePath, jsContent);
  
  // Remove original .ts file
  fs.unlinkSync(filePath);
}

/**
 * Recursively transform all .ts files in a directory to .js
 * @param {string} dir - Directory path
 */
export function transformDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      transformDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      transformFile(fullPath);
    }
  }
}

/**
 * Main function to transform a TypeScript project to JavaScript
 * @param {string} targetDir - Root directory of the project
 */
export function transformToJavaScript(targetDir) {
  // Transform all .ts files to .js
  const srcDir = path.join(targetDir, 'src');
  if (fs.existsSync(srcDir)) {
    transformDirectory(srcDir);
  }

  // Update package.json
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Get JavaScript dependencies
    const { dependencies, devDependencies } = getJavaScriptDependencies(
      packageJson.dependencies || {},
      packageJson.devDependencies || {}
    );

    // Update package.json
    packageJson.dependencies = dependencies;
    packageJson.devDependencies = devDependencies;
    packageJson.scripts = getJavaScriptScripts();
    
    // Add Node.js native imports for path aliasing
    packageJson.imports = getNodeImportsConfig();

    // Ensure type: module is set
    packageJson.type = 'module';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }

  // Remove tsconfig.json if it exists
  const tsconfigPath = path.join(targetDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    fs.unlinkSync(tsconfigPath);
  }

  // Update .prettierrc if it exists to use .js instead of .ts
  const prettierrcPath = path.join(targetDir, '.prettierrc');
  if (fs.existsSync(prettierrcPath)) {
    let prettierConfig = fs.readFileSync(prettierrcPath, 'utf-8');
    prettierConfig = prettierConfig.replace(/\.ts/g, '.js');
    fs.writeFileSync(prettierrcPath, prettierConfig);
  }

  // Update eslint.config.js if it exists
  const eslintConfigPath = path.join(targetDir, 'eslint.config.js');
  if (fs.existsSync(eslintConfigPath)) {
    let eslintConfig = fs.readFileSync(eslintConfigPath, 'utf-8');
    
    // Remove TypeScript parser and plugin
    eslintConfig = eslintConfig.replace(/@typescript-eslint\/parser/g, '');
    eslintConfig = eslintConfig.replace(/@typescript-eslint\/eslint-plugin/g, '');
    eslintConfig = eslintConfig.replace(/tseslint\./g, '');
    eslintConfig = eslintConfig.replace(/import tseslint[^\n]+\n/g, '');
    
    // Update file patterns
    eslintConfig = eslintConfig.replace(/\*\*\/\*\.ts/g, '**/*.js');
    
    fs.writeFileSync(eslintConfigPath, eslintConfig);
  }
}

