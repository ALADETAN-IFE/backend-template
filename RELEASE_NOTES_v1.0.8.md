# Release Notes: v1.0.8

## 🎯 What's New in v1.0.3 - v1.0.8

This release consolidates multiple critical bug fixes and improvements made over the past iterations, focusing on stability, cross-platform compatibility, and developer experience.

---

## 🐛 Critical Bug Fixes

### **Environment & Configuration Issues**

- **Fixed CORS environment setup** - ENV is now properly imported in `app.ts` when CORS feature is selected
- **Fixed `envContent is not defined` error** - Resolved critical runtime error when CORS feature was enabled
- **Added JWT_SECRET to environment** - Properly configured JWT authentication with environment variables
- **Fixed MongoDB conditional imports** - Mongoose is now only included when authentication is enabled, preventing build errors

### **Cross-Platform Compatibility**

- **Windows shell compatibility** - All CI steps now use bash shell explicitly for Windows/macOS/Linux compatibility
- **Fixed JSON parsing** - Properly strips comments from `tsconfig.json` before parsing (Node.js doesn't support JSON comments natively)
- **Corrected string syntax** - Fixed quote mismatch in CORS import generation

### **Installation & Setup Improvements**

- **Resilient Husky setup** - Git hooks setup now gracefully handles npm install failures
- **Smart installation tracking** - Uses `installSucceeded` flag instead of checking `node_modules` directory
- **Automatic code formatting** - Runs `npm run format` after successful dependency installation
- **Better error messages** - Clear guidance when native modules (like argon2) fail to install on Windows

---

## ✨ Enhancements

### **CI/CD & Automation**

- **Non-interactive mode support** - Added CI mode detection with sensible defaults for automated testing
- **GitHub Actions compatibility** - Proper bash shell configuration for all workflow steps
- **npm publish automation** - Fixed publishing workflow with correct permissions, provenance, and environment settings
- **Default microservice mode** - Automatically defaults to Docker mode in CI environments

### **Developer Experience**

- **Dependency management** - Added `package-lock.json` for reproducible builds with `npm ci`
- **Conditional formatting** - Only runs code formatting when dependencies install successfully
- **Skip failed setups gracefully** - Project creation continues even if optional steps fail

---

## 🔧 Technical Improvements

- **Refactored installation tracking** - Cleaner code with `installSucceeded` flag propagation
- **Removed redundant checks** - Eliminated duplicate `node_modules` existence validation
- **Better error handling** - Try-catch blocks for Husky and formatting steps
- **Async/await fixes** - Properly handled top-level await in server startup

---

## 📦 Publishing & Distribution

- **Fixed npm publish workflow** - Resolved multiple publishing configuration issues (v1.0.3-1.0.6)
- **Added provenance support** - Enhanced package security with npm provenance
- **OIDC authentication** - Proper GitHub Actions permissions for secure publishing
- **Public access configured** - Scoped package correctly published as public

---

## 🚀 Installation

```bash
# Create new project
npx @ifecodes/backend-template@latest my-project

# Or install globally
npm install -g @ifecodes/backend-template
ifecodes-template my-project
```

---

## 💡 Migration Notes

If upgrading from v1.0.0:

1. **Authentication projects**: JWT_SECRET is now required in `.env` file
2. **CORS enabled projects**: ENV is automatically imported in `app.ts`
3. **Windows users**: Better support for native modules - choose bcrypt over argon2 if you don't have build tools
4. **CI/CD users**: Non-interactive mode now works out of the box

---

## 🔗 Full Changelog

**Full Changelog**: https://github.com/ALADETAN-IFE/backend-template/compare/v1.0.0...v1.0.8

---

## 🙏 Thank You

Thank you for using `@ifecodes/backend-template`! If you encounter any issues, please report them on [GitHub Issues](https://github.com/ALADETAN-IFE/backend-template/issues).

---

This release brings the template to a stable, production-ready state with proper error handling, cross-platform support, and automated publishing! 🎉
