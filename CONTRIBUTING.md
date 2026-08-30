# Contributing to AuditLens

Thank you for your interest in contributing to AuditLens! This document provides guidelines and information for contributors.

## How to Contribute

### 1. Fork the Repository

```bash
git clone https://github.com/your-username/auditlens.git
cd auditlens
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
npm install
npm run baseline  # Test baseline analysis
npm run advanced  # Test multi-agent analysis
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "Add: brief description of changes"
```

Use clear commit messages:
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for improvements
- `Remove:` for deletions

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Development Setup

### Prerequisites

- Node.js 18+
- Featherless AI API key (free at featherless.ai)

### Installation

```bash
git clone https://github.com/thesithunyein/auditlens.git
cd auditlens
npm install
cp .env.example .env  # Add your API key
```

### Running Locally

```bash
npm run dev          # Start local server
npm run evaluate     # Run full evaluation
```

## Code Style

- Use vanilla JavaScript (no frameworks)
- Follow existing naming conventions
- Keep functions small and focused
- Add comments for complex logic

## Reporting Issues

When reporting issues, please include:

1. **Description** of the problem
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment** (OS, browser, Node version)

## Feature Requests

Feature requests are welcome! Please open an issue with:

1. **Problem** you're trying to solve
2. **Proposed solution**
3. **Alternatives considered**
4. **Additional context**

## Questions?

Feel free to open an issue for questions or reach out directly.

Thank you for contributing! 🎉
