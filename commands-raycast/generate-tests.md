---
description: Generate comprehensive unit tests for the specified code
---

# Generate Tests Command

Generate comprehensive unit tests for the specified code or function. Create tests that are maintainable, readable, and provide good coverage.

## Test Requirements

1. **Coverage**
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary values

2. **Test Structure**
   - Clear test names (describe what is being tested)
   - Arrange-Act-Assert pattern
   - Independent tests (no interdependencies)
   - One assertion per test when possible

3. **Mocking**
   - Mock external dependencies
   - Mock API calls
   - Mock database queries
   - Use appropriate mocking libraries

4. **Best Practices**
   - Test behavior, not implementation
   - Use descriptive test names
   - Keep tests simple and focused
   - Add comments for complex test scenarios

## What to Include

- Setup and teardown if needed
- Test fixtures or factories
- Mock data that's realistic
- Assertions that verify expected behavior
- Error message validation where appropriate

Generate tests using the project's existing testing framework (Jest, Vitest, etc.) and follow the project's testing conventions.
