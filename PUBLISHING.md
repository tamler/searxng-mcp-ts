# Publishing to npm

This document describes the process for publishing new releases of `searxng-mcp-ts` to npm.

## Overview

The package is published to npm automatically via GitHub Actions when a new release is created on GitHub. The workflow ensures that:
- The package is built successfully
- The version in `package.json` matches the release tag
- The package is published with provenance information for security

## Automated Publishing (Recommended)

### Prerequisites

1. **NPM Token**: A repository administrator must configure the `NPM_TOKEN` secret in GitHub
   - Go to npmjs.com and create an automation token with "Automation" type
   - In the GitHub repository, go to Settings > Secrets and variables > Actions
   - Add a new secret named `NPM_TOKEN` with your npm automation token

### Publishing Process

1. **Update Version**: Update the version in `package.json` to the new version number
   ```bash
   npm version patch  # for patch releases (0.1.2 -> 0.1.3)
   npm version minor  # for minor releases (0.1.2 -> 0.2.0)
   npm version major  # for major releases (0.1.2 -> 1.0.0)
   ```
   This will also create a git tag automatically.

2. **Push Changes**: Push the changes and tags to GitHub
   ```bash
   git push origin main
   git push origin --tags
   ```

3. **Create GitHub Release**: 
   - Go to the GitHub repository's "Releases" page
   - Click "Draft a new release"
   - Select the tag you just created (e.g., `v0.1.3`)
   - Add a release title and description (changelog)
   - Click "Publish release"

4. **Automated Publishing**: The GitHub Actions workflow will automatically:
   - Checkout the code
   - Install dependencies
   - Build the project
   - Publish to npm with provenance

You can monitor the workflow progress in the "Actions" tab of the GitHub repository.

## Manual Publishing (Alternative)

If you need to publish manually (not recommended for regular releases):

### Prerequisites

1. **npm Account**: You must have an npm account with publish rights for `searxng-mcp-ts`
2. **Authentication**: Log in to npm locally
   ```bash
   npm login
   ```

### Publishing Steps

1. **Ensure Clean State**: Make sure you have no uncommitted changes
   ```bash
   git status
   ```

2. **Update Version**: Update the version in `package.json`
   ```bash
   npm version patch  # or minor/major
   ```

3. **Build**: Build the project
   ```bash
   npm run build
   ```

4. **Test**: Verify the build works
   ```bash
   node build/index.js --help
   ```

5. **Publish**: Publish to npm
   ```bash
   npm publish --access public
   ```

6. **Create Git Tag**: If you didn't use `npm version`, create and push a tag
   ```bash
   git tag v0.1.3
   git push origin main
   git push origin --tags
   ```

7. **Create GitHub Release**: Create a matching release on GitHub for consistency

## Version Management

This project follows [Semantic Versioning (SemVer)](https://semver.org/):

- **Patch** (0.1.x): Bug fixes and minor changes
- **Minor** (0.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

## What Gets Published

The npm package includes only the necessary files for runtime, controlled by the `"files"` field in `package.json`:
- `build/` directory (compiled JavaScript)
- `package.json` (automatically included)
- `LICENSE` (automatically included)
- `README.md` (automatically included)

Source files, tests, and development configurations are excluded.

## Verification

After publishing, verify the package:

1. **Check npm**: Visit https://www.npmjs.com/package/searxng-mcp-ts
2. **Test Installation**: Install the package in a test directory
   ```bash
   npm install -g searxng-mcp-ts@latest
   searxng-mcp-ts --help
   ```

## Troubleshooting

### Authentication Errors

If you get authentication errors during automated publishing:
- Verify the `NPM_TOKEN` secret is set correctly in GitHub
- Ensure the token has not expired
- Check that the token has "Automation" type (not "Publish")

### Version Conflicts

If npm rejects the publish due to version conflicts:
- Ensure `package.json` version is higher than the latest published version
- Check that you haven't already published this version

### Build Failures

If the build fails in the workflow:
- Run `npm run build` locally to reproduce the issue
- Check that all dependencies are correctly specified in `package.json`
- Verify TypeScript compilation succeeds

## Security Notes

- The workflow uses `--provenance` flag to publish with provenance information
- This creates a cryptographic link between the npm package and the source code
- The workflow requires `id-token: write` permission for provenance generation
- Never commit npm tokens to the repository
- Use npm automation tokens (not classic tokens) for CI/CD
