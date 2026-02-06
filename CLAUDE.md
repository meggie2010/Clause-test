# CLAUDE.md

This file provides guidance for AI assistants working with the Clause-test repository.

## Project Overview

Clause-test is a newly initialized project repository. It is in the early stages of development and does not yet contain application code, build tooling, or tests.

## Repository Structure

```
/
├── README.md        # Project title and description
├── CLAUDE.md        # This file — AI assistant guidance
└── .git/            # Git version control
```

## Current State

- **Languages/Frameworks**: None yet configured
- **Build System**: None yet configured
- **Package Manager**: None yet configured
- **Testing**: None yet configured
- **Linting/Formatting**: None yet configured
- **CI/CD**: None yet configured

## Git Workflow

- **Remote**: GitHub (origin)
- **Default Branch**: `main`
- **Commit Style**: Use clear, concise commit messages describing the "why" behind changes

## Development Guidelines

When adding code to this repository, follow these conventions:

### General

- Keep the repository clean — do not commit IDE-specific files, OS artifacts, or secrets
- Add a `.gitignore` appropriate to the chosen language/framework before adding source code
- Update this CLAUDE.md as the project evolves (add build commands, test commands, architecture notes)

### Code Quality

- Set up linting and formatting tools early and document the commands here
- Write tests alongside new features
- Prefer simple, readable code over clever abstractions

### Documentation

- Keep README.md up to date with setup instructions and project purpose
- Document build, test, and lint commands in this file as they are added

## Common Commands

_No commands configured yet. Update this section as tooling is added._

<!-- Example format for future use:
```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```
-->
