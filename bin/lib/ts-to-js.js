/**
 * Transform TypeScript files to JavaScript
 * Removes type annotations and converts file extensions
 */

/**
 * Strip TypeScript type annotations from code
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
