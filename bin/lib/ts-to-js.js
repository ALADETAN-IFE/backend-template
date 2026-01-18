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

  // Remove imports from express types (Request, Response, NextFunction, etc.)
  jsContent = jsContent.replace(/import\s*\{\s*Request\s*,\s*Response\s*,\s*NextFunction\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Request\s*,\s*Response\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Response\s*,\s*Request\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Request\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*Response\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');
  jsContent = jsContent.replace(/import\s*\{\s*NextFunction\s*\}\s*from\s*["']express["'];?\s*\n/gm, '');

  // Remove interface declarations FIRST (before other transformations)
  // CRITICAL: Must have 'interface' keyword explicitly (not 'const' or other keywords)
  // Single-line interfaces
  jsContent = jsContent.replace(/^export\s+interface\s+\w+(\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}\s*;?/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+(\s+extends\s+[\w,\s]+)?\s*\{[^}]*\}\s*;?/gm, '');
  
  // Multi-line interfaces - more aggressive matching
  jsContent = jsContent.replace(/^export\s+interface\s+\w+(\s+extends\s+[\w,\s<>]+)?\s*\{[\s\S]*?\n\}/gm, '');
  jsContent = jsContent.replace(/^interface\s+\w+(\s+extends\s+[\w,\s<>]+)?\s*\{[\s\S]*?\n\}/gm, '');

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
  // Match ! when followed by comma, semicolon, dot, closing paren/bracket, newline, or end
  // This approach is more reliable and catches all cases like process.env.VAR!,
  jsContent = jsContent.replace(/!\s*(?=[,;.)\]\n}]|$)/g, "");
  
  // Remove function parameter types - COMPREHENSIVE VERSION
  // Must handle: param: Type, param: Type[], param: Promise<Type>, destructured params, etc.
  
  // Remove parameter type annotations from function signatures
  // Handle destructured parameters like ({ email, password }: { email: string, password: string })
  jsContent = jsContent.replace(/\(\s*\{([^}]+)\}\s*:\s*\{[^}]+\}\s*\)/g, '({ $1 })');
  
  // Remove simple parameter types: param: Type
  jsContent = jsContent.replace(/(\w+)\s*:\s*[^,=){\n]+(?=[,)])/g, '$1');
  
  // Remove return type annotations from functions
  // Match ): ReturnType => or ): ReturnType {
  jsContent = jsContent.replace(/\)\s*:\s*[^{=>]+(?=[{=>])/g, ')');
  
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

  // Convert ES modules to CommonJS
  // 1. Convert import statements to require()
  
  // Handle: import defaultExport, { named } from "module" (must be first - more specific)
  jsContent = jsContent.replace(/^import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/gm, 
    (match, defaultName, named, module) => {
      return `const ${defaultName} = require("${module}");\nconst {${named}} = require("${module}");`;
    });
  
  // Handle: import * as name from "module"
  jsContent = jsContent.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?/gm, 
    'const $1 = require("$2");');
  
  // Handle: import { named } from "module"
  jsContent = jsContent.replace(/^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/gm, 
    'const {$1} = require("$2");');
  
  // Handle: import defaultExport from "module"
  jsContent = jsContent.replace(/^import\s+(\w+)\s+from\s+["']([^"']+)["'];?/gm, 
    'const $1 = require("$2");');
  
  // 2. Convert export statements to module.exports
  
  // Handle: export { default as name } from "module"
  jsContent = jsContent.replace(/^export\s+\{\s*default\s+as\s+(\w+)\s*\}\s+from\s+["']([^"']+)["'];?/gm,
    'const $1 = require("$2");');
  
  // Handle: export { named } from "module" (re-export)
  jsContent = jsContent.replace(/^export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/gm,
    (match, names, module) => {
      return `const {${names}} = require("${module}");`;
    });
  
  // Handle: export default something
  jsContent = jsContent.replace(/^export\s+default\s+(.+);?/gm, 'module.exports = $1;');
  
  // Handle: export { named } (local exports) - but NOT re-exports
  jsContent = jsContent.replace(/^export\s+\{([^}]+)\};?$/gm, (match, names) => {
    // Don't process if it was a re-export (already handled above)
    if (match.includes(' from ')) return match;
    return `module.exports = {${names}};`;
  });
  
  // Handle: export const/let/var name = value
  jsContent = jsContent.replace(/^export\s+(const|let|var)\s+/gm, '$1 ');
  
  // Collect all exported names to create module.exports at the end
  const exportedNames = [];
  const reExportedNames = [];
  
  // Collect names from re-exports (export { x } from "module")
  const reExportMatches = content.matchAll(/^export\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/gm);
  for (const match of reExportMatches) {
    const names = match[1].split(',').map(n => {
      const trimmed = n.trim();
      // Handle "default as name" -> extract "name"
      const asMatch = trimmed.match(/default\s+as\s+(\w+)/);
      if (asMatch) return asMatch[1];
      return trimmed;
    });
    reExportedNames.push(...names);
  }
  
  // Collect names from local const/let/var exports
  const exportPattern = /^(?:const|let|var)\s+(\w+)\s*=/gm;
  let match;
  while ((match = exportPattern.exec(jsContent)) !== null) {
    // Only collect if it was originally an export
    if (content.includes(`export const ${match[1]}`) || 
        content.includes(`export let ${match[1]}`) || 
        content.includes(`export var ${match[1]}`)) {
      exportedNames.push(match[1]);
    }
  }
  
  // Combine all exports
  const allExports = [...exportedNames, ...reExportedNames];
  
  // Add module.exports for collected named exports (if not already present)
  if (allExports.length > 0 && !jsContent.includes('module.exports')) {
    const exportsObj = allExports.map(name => `  ${name}`).join(',\n');
    jsContent += `\n\nmodule.exports = {\n${exportsObj}\n};\n`;
  }
  
  // 3. Remove path aliases and file extensions
  // Remove @/ and #/ path aliases, keep relative paths as-is (no extensions needed in CommonJS)
  jsContent = jsContent.replace(/require\(["']@\/([^"']+)["']\)/g, (match, path) => {
    // Convert @/ to relative path from src root
    return `require("./${path}")`;
  });
  
  jsContent = jsContent.replace(/require\(["']#\/([^"']+)["']\)/g, (match, path) => {
    // Convert #/ to relative path - this needs context-aware replacement
    // For now, just remove the alias and let users fix manually if needed
    return `require("./${path}")`;
  });
  
  // Remove .js extensions from require statements (not needed in CommonJS)
  jsContent = jsContent.replace(/require\(["']([^"']+)\.js["']\)/g, 'require("$1")');

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
 * Get package.json configuration for CommonJS (no imports field needed)
 * @returns {null} - No imports configuration needed for CommonJS
 */
export function getNodeImportsConfig() {
  return null; // CommonJS doesn't need imports field
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
    
    // Don't add imports field for CommonJS (it's null)
    const importsConfig = getNodeImportsConfig();
    if (importsConfig) {
      packageJson.imports = importsConfig;
    } else {
      // Remove imports field if it exists
      delete packageJson.imports;
    }

    // Remove type: module (we're using CommonJS)
    delete packageJson.type;

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

