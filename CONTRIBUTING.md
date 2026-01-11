# Contributing to Backend Template

Thank you for considering contributing to Backend Template!  
We welcome all kinds of contributions, including bug reports, feature requests, and code improvements.

---

## Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Code Contributions](#code-contributions)
- [Development Workflow](#development-workflow)
- [Branch Naming Rules](#branch-naming-rules)
- [Commit Message Rules](#commit-message-rules)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ALADETAN-IFE/backend-template.git
   ```

2. Navigate to the project directory:
   ```bash
   cd backend-template
   ```
   
3. Install dependencies:
   ```bash
   npm install
   ```
   
4. Link the CLI locally for testing:
   ```bash
   npm link
   ```

5. Test the CLI:
   ```bash
   backend-template test-project
   ```

---

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on [GitHub Issues](https://github.com/ALADETAN-IFE/backend-template/issues) and include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs or screenshots
- Your OS and Node.js version

### Suggesting Features

If you have a feature idea, open an issue and describe:

- What the feature should do
- Why it is useful
- How you imagine it working
- Example use cases

### Code Contributions

All code contributions should be done on a feature branch in your local clone and submitted via a pull request to the upstream repository.

### Logging

When working on the generated projects, use the project's logger utility instead of `console.log` for consistency:

```ts
import { logger } from "@/utils";

logger.log("AUTH", "User logged in", user);
logger.warn("API", "Slow response detected");
logger.error("PAYMENT", err);
```

---

## Development Workflow

1. Create a new branch for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes

3. Test your changes:
   ```bash
   # Test CLI generation
   backend-template test-project mono
   backend-template test-microservice micro
   
   # Test the generated projects
   cd test-project
   npm install
   npm run dev
   ```

4. Commit your changes (see commit rules below)

5. Push to your fork and submit a pull request

---

## Branch Naming Rules

Branch names should follow this structure:

```
<prefix>/<description>
```

### Allowed Prefixes

- `feat/` — new feature
- `fix/` — bug fix
- `refactor/` — code restructuring
- `chore/` — routine tasks
- `docs/` — documentation changes

### Rules

- Description should be lowercase and short
- Use hyphens to separate words

### Examples

```
feat/add-docker-support
fix/env-file-generation
chore/update-dependencies
docs/improve-readme
```

---

## Commit Message Rules

Commit messages follow this style:

```
type: commit message
```

### Allowed Types

- `feat` — new feature
- `fix` — bug fix
- `refactor` — code restructuring
- `chore` — routine tasks 
- `docs` — documentation changes

### Examples

```
feat: add morgan logger support
fix: resolve argon2 installation on Windows
refactor: modularize CLI into separate files
docs: update installation instructions
```

### Important

Use imperative tense:

- ✔️ "add login validation"
- ❌ "added login validation"
- ❌ "I added login validation"

Keep messages concise and descriptive.

---

## Submitting Pull Requests

1. Make sure your branch is up to date with the `main` branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout <your-branch>
   git rebase main
   ```

2. Run tests before submitting (if applicable):
   ```bash
   npm test
   ```

3. Open a pull request to the upstream repository

4. In your PR description, include:
   - **What you changed** - List the modifications
   - **Why you changed it** - Explain the reasoning
   - **How to test it** - Steps to verify the changes
   - **Screenshots** (if UI/output changes)

5. Be responsive to code review feedback

---

## Testing Your Changes

### Test CLI Generation

```bash
# Monolith with all features
backend-template test-mono mono

# Microservice with Docker
backend-template test-micro micro

# Test prompts (interactive)
backend-template
```

### Test Generated Projects

```bash
# Test monolith
cd test-mono
npm install
npm run dev
# Visit http://localhost:4000

# Test microservice
cd test-micro
docker-compose up
# Visit http://localhost:4000/health
```

---

## Code Style

- Use **ES modules** (`import`/`export`)
- Use **TypeScript** in generated templates
- Follow existing code patterns
- Add comments for complex logic
- Keep functions small and focused

---

## Project Structure

```
backend-template/
├── bin/
│   ├── cli.js                # Main CLI entry point
│   └── lib/
│       ├── prompts.js        # User prompts
│       ├── service-setup.js  # Service configuration
│       ├── microservice-config.js # Docker/PM2 setup
│       └── readme-generator.js    # README generation
├── template/
│   ├── base/             # Base template files
│   ├── features/         # Optional features (CORS, auth, etc.)
│   ├── gateway/          # Gateway service template
│   └── microservice/     # Microservice configs
├── README.md
├── CONTRIBUTING.md
└── package.json
```

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/).

Please report unacceptable behavior to: **ifecodes01@gmail.com**

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to open an issue or reach out to [@IfeCodes](https://twitter.com/IfeCodes_) on Twitter.

Thank you for contributing! 🎉
