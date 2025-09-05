# Contributing to Modals Component

Thank you for your interest in contributing! 🎉

## Development Setup

### Prerequisites

- Node.js >= 16
- pnpm >= 8

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/modals-component.git
   cd modals-component
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development mode**
   ```bash
   pnpm dev
   ```

## Development Workflow

### Scripts

- `pnpm dev` - Start development mode with watch
- `pnpm build` - Build for production
- `pnpm build:dev` - Build for development
- `pnpm test` - Run tests
- `pnpm type-check` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm size-check` - Check bundle size

### Code Quality

This project uses:

- **TypeScript** for type safety
- **Prettier** for code formatting
- **pnpm** for package management

### Before Submitting a PR

1. **Run quality checks**

   ```bash
   pnpm format:check
   pnpm type-check
   pnpm test
   pnpm build
   ```

2. **Follow the PR template**
   - Fill out all sections of the PR template
   - Link related issues
   - Add screenshots if UI changes are involved

3. **Write meaningful commit messages**
   ```bash
   feat(modal): add animation support
   fix(modal): resolve focus trap issue
   docs(readme): update installation instructions
   ```

## Project Structure

```
modals-component/
├── src/                 # Source code
│   └── index.tsx       # Main modal component
├── dist/               # Built files (auto-generated)
├── .github/            # GitHub workflows and templates
├── package.json        # Package configuration
├── tsup.config.ts      # Build configuration
└── tsconfig.json       # TypeScript configuration
```

## Coding Guidelines

### TypeScript

- Use strict TypeScript settings
- Export interfaces for public APIs
- Add JSDoc comments for public methods
- Prefer `interface` over `type` for object shapes

### React

- Use functional components with hooks
- Follow React best practices
- Ensure components are accessible
- Add proper prop validation

### Styling

- Use inline styles for simplicity (current approach)
- Consider CSS-in-JS solutions for complex styling
- Ensure responsive design
- Follow accessibility guidelines

## Testing

### Writing Tests

- Write tests for all new features
- Include edge cases
- Test accessibility features
- Use descriptive test names

### Test Structure

```typescript
describe('Modal', () => {
  it('should render when isOpen is true', () => {
    // Test implementation
  })

  it('should call onClose when overlay is clicked', () => {
    // Test implementation
  })
})
```

## Documentation

- Update README.md for new features
- Add JSDoc comments to public APIs
- Include code examples
- Update CHANGELOG.md

## Release Process

Releases are automated through GitHub Actions:

1. **Create a release** on GitHub
2. **Tag format**: `v1.0.0` (semantic versioning)
3. **CI/CD pipeline** automatically:
   - Runs quality checks
   - Builds the package
   - Publishes to npm

## Getting Help

- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check the README and code comments

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's coding standards

Thank you for contributing! 🚀
