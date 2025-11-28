# Contributing to Parent AI

Thank you for your interest in contributing to Parent AI! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature already exists or has been requested
- Provide a clear use case
- Explain the expected behavior
- Consider implementation complexity

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🧪 Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/parent-ai.git
cd parent-ai

# Install dependencies
npm install
cd mobile && npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev
```

## 📋 Code Style

- Use ES6+ features
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### JavaScript Style Guide

```javascript
// Use const/let, not var
const API_URL = 'http://localhost:3000';
let counter = 0;

// Use arrow functions
const processActivity = async (data) => {
  // implementation
};

// Use template literals
console.log(`Processing ${activity.name}`);

// Use async/await over promises
const result = await fetchData();
```

## 🧪 Testing

Before submitting:

```bash
# Run backend tests
npm test

# Run test script
node test-system.js

# Test mobile app
cd mobile
npm start
```

## 📝 Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug in monitoring service
docs: Update README
style: Format code
refactor: Refactor AI service
test: Add tests for notifications
chore: Update dependencies
```

## 🔒 Security

- Never commit sensitive data (API keys, passwords)
- Use environment variables
- Follow security best practices
- Report security issues privately

## 📄 Documentation

- Update README.md for user-facing changes
- Update API_DOCUMENTATION.md for API changes
- Add inline comments for complex code
- Update CHANGELOG.md

## 🎯 Priority Areas

We especially welcome contributions in:

- **Testing**: Unit tests, integration tests
- **Documentation**: Tutorials, examples, guides
- **Performance**: Optimization, caching
- **Features**: New monitoring capabilities
- **UI/UX**: Mobile app improvements
- **Security**: Security enhancements
- **Accessibility**: Accessibility improvements

## 🚫 What We Don't Accept

- Code that violates privacy laws
- Malicious code
- Poorly documented code
- Breaking changes without discussion
- Code that doesn't follow style guide

## ❓ Questions

Feel free to open an issue for questions about:
- Implementation details
- Design decisions
- Best practices
- Feature feasibility

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for making Parent AI better!

