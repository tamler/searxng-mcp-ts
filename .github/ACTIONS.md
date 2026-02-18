# GitHub Actions Configuration

This repository uses GitHub Actions for continuous integration and automated npm publishing.

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: On every push to `main` branch and on all pull requests

**Purpose**: Validates that the code builds successfully across multiple Node.js versions

**Steps**:
1. Check out code
2. Setup Node.js (tests against versions 18.x, 20.x, and 22.x)
3. Install dependencies with `npm ci`
4. Build the project with `npm run build`
5. Verify that `build/index.js` exists and is executable

**Why**: Ensures that changes don't break the build process before merging

### Publish Workflow (`.github/workflows/publish.yml`)

**Trigger**: When a new GitHub release is published

**Purpose**: Automatically publishes the package to npm when a new release is created

**Steps**:
1. Check out code
2. Setup Node.js 20 with npm registry configuration
3. Install dependencies with `npm ci`
4. Build the project
5. Publish to npm with provenance

**Requirements**:
- `NPM_TOKEN` secret must be configured in repository settings
- The npm token must have "Automation" type permissions

## Setting Up NPM_TOKEN Secret

To enable automated publishing, a repository administrator must:

1. **Create an npm Automation Token**:
   - Log in to [npmjs.com](https://www.npmjs.com)
   - Go to your profile settings > Access Tokens
   - Click "Generate New Token"
   - Select "Automation" type (not "Publish" or "Read only")
   - Save the token securely

2. **Add Token to GitHub**:
   - Go to the repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm automation token
   - Click "Add secret"

## How It Works

### For Regular Development:
1. Developer pushes code or creates PR
2. CI workflow runs automatically
3. Build is validated across Node.js versions
4. Results appear in PR checks

### For Releases:
1. Developer updates version in `package.json` (e.g., using `npm version patch`)
2. Developer creates a GitHub release with matching tag
3. Publish workflow triggers automatically
4. Package is built and published to npm
5. Provenance information links the npm package to the GitHub release

## Security Features

- **Provenance**: The publish workflow uses `--provenance` flag, which:
  - Creates a cryptographic link between the package and its source
  - Provides transparency about where and how the package was built
  - Requires `id-token: write` permission

- **Access Control**: Workflows use minimal required permissions
  - CI: default read-only access
  - Publish: read content + write id-token (for provenance)

- **Token Security**: 
  - NPM_TOKEN is stored as a GitHub Secret (encrypted)
  - Never exposed in logs or code
  - Automation tokens are more secure than user tokens

## Maintenance

- Keep workflow actions up to date (e.g., `actions/checkout@v4`, `actions/setup-node@v4`)
- Rotate NPM_TOKEN periodically for security
- Review workflow runs in the Actions tab
- Update Node.js versions in CI matrix as new LTS versions are released
