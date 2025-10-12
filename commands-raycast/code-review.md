---
description: Perform comprehensive code review with security and quality checks
---

# Code Review Command

Perform a thorough code review of the specified files or changes. Focus on code quality, security, performance, and best practices.

## What to Review

Analyze the following aspects:

1. **Code Quality**
   - Readability and maintainability
   - Naming conventions
   - Code organization
   - DRY principle adherence

2. **Security**
   - Input validation
   - Authentication/authorization
   - Data exposure
   - Injection vulnerabilities

3. **Performance**
   - Algorithm efficiency
   - Database query optimization
   - Caching opportunities
   - Resource usage

4. **Testing**
   - Test coverage
   - Test quality
   - Edge cases

5. **Documentation**
   - Code comments
   - API documentation
   - README updates

## Output Format

Provide feedback in this structure:
- **Critical Issues**: Must fix before merging
- **High Priority**: Should fix soon
- **Medium Priority**: Consider addressing
- **Low Priority**: Nice to have improvements
- **Positive Notes**: Good practices observed

Be specific, constructive, and provide code examples where helpful.
