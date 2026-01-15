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

  // Remove imports from express types (Request, Response, etc.)
  jsContent = jsContent.replace(/import\s*\{\s*Request\s*,\s*Response\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Response\s*,\s*Request\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Request\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Response\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');

  // Remove interface declarations
  // CRITICAL: Must have 'interface' keyword explicitly (not 'const' or other keywords)
  // Single-line interfaces
  jsContent = jsContent.replace(/^export\s+interface\s+\w+(\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}\s*;?\s*$/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+(\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}\s*;?\s*$/gm, '');
  
  // Multi-line interfaces - must have a line break after the interface name/extends before {
  // This prevents matching regular object literals
  jsContent = jsContent.replace(/^export\s+interface\s+\w+(\s+extends\s+[\w,\s<>]+)?\s*\{[\s\S]*?^}/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+(\s+extends\s+[\w,\s<>]+)?\s*\{[\s\S]*?^}/gm, '');

  // Remove type aliases
  jsContent = jsContent.replace(/^export\s+type\s+\w+\s*=\s*[^;]+;\s*$/gm, '');
  jsContent = jsContent.replace(/^type\s+\w+\s*=\s*[^;]+;\s*$/gm, '');
  
  // Remove class property type annotations: public/private/protected status: number;
  // CRITICAL: Only match single-line class properties (use [^\n;=]+ instead of [^;=]+)
  jsContent = jsContent.replace(/^\s*(public|private|protected)?\s+(\w+)\s*:\s*[^\n;=]+;/gm, '');
  
  // Remove visibility modifiers and types from constructor parameters
  jsContent = jsContent.replace(/constructor\s*\(\s*([^)]*)\)\s*\{/g, (match, params) => {
    if (!params.trim()) return 'constructor() {';
    const cleanParams = params
      .split(',')
      .map(p => {
        // Remove visibility modifiers
        let cleaned = p.replace(/^\s*(public|private|protected)\s+/, '');
        // Remove type annotation (everything after :)
        cleaned = cleaned.replace(/:\s*[^=,]+/, '');
        return cleaned.trim();
      })
      .filter(p => p)
      .join(', ');
    return `constructor(${cleanParams}) {`;
  });

  // Remove ! non-null assertions FIRST (before other transformations)
  // Only remove ! that appears after identifiers, closing brackets, or closing parentheses
  // Be very conservative to avoid breaking other syntax
  jsContent = jsContent.replace(/([a-zA-Z0-9_\])])!/g, '$1');
  
  // Remove function parameter types - IMPROVED VERSION
  // Handle spread parameters: ...args: Type[] => ...args
  jsContent = jsContent.replace(/(\.\.\.\s*\w+)\s*:\s*[^,)]+/g, '$1');
  
  // Handle regular parameters with more precision
  // Match parameter name followed by colon and type, but not property access
  jsContent = jsContent.replace(/\(([^)]*)\)/g, (match, params) => {
    // Skip if it's not a parameter list (e.g., empty parens or no colons)
    if (!params.includes(':')) return match;
    
    const cleanedParams = params
      .split(',')
      .map(param => {
        // Remove type annotation (everything from : to end of param or = sign)
        return param.replace(/:\s*[^,=]+/, '');
      })
      .join(',');
    
    return `(${cleanedParams})`;
  });
  
  // Remove return type annotations - IMPROVED VERSION
  // Match ): Type => but only consume the type part
  jsContent = jsContent.replace(/\)\s*:\s*[^{=>]+(\s*=>)/g, ')$1');
  jsContent = jsContent.replace(/\)\s*:\s*[^{=>]+(\s*\{)/g, ')$1');
  
  // Remove function parameter types in function declarations
  jsContent = jsContent.replace(/function\s+(\w+)\s*:\s*[^=]+/g, 'function $1');
  
  // Remove as type assertions (including 'as const')
  jsContent = jsContent.replace(/\s+as\s+(const|any|unknown|readonly|\w+)/g, '');
  
  // Remove satisfies operators
  jsContent = jsContent.replace(/\s+satisfies\s+[^;,\n]+/g, '');
  
  // Remove angle bracket type assertions: <Type>value => value (but not JSX)
  jsContent = jsContent.replace(/<[\w\[\]]+>(?=[^<]*[^>])/g, '');
  
  // Remove optional property markers: property?: Type => property
  jsContent = jsContent.replace(/(\w+)\?\s*:/g, '$1:');
  
  // Remove generic type parameters from class/function declarations
  jsContent = jsContent.replace(/(class|function|interface)\s+(\w+)\s*<[^>]+>/g, '$1 $2');
  
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

