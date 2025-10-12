---
description: Generate complete API endpoint with routes, controllers, validation, and tests
---

# API Scaffold Command

Generate a complete, production-ready API endpoint with all necessary components.

## What to Generate

1. **Route Definition**
   - RESTful endpoint paths
   - HTTP methods (GET, POST, PUT, DELETE)
   - Route parameters and query strings
   - Middleware integration

2. **Controller**
   - Request handling logic
   - Input validation
   - Business logic calls
   - Response formatting
   - Error handling

3. **Models/Schemas**
   - Database models
   - TypeScript interfaces/types
   - Validation schemas (Zod, Joi, etc.)
   - Serialization logic

4. **Validation**
   - Request body validation
   - Query parameter validation
   - Path parameter validation
   - Custom validators

5. **Documentation**
   - JSDoc comments
   - OpenAPI/Swagger annotations
   - Example requests/responses
   - Error codes documentation

6. **Tests**
   - Unit tests for controllers
   - Integration tests for endpoints
   - Edge case testing
   - Error scenario testing

## Best Practices

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement rate limiting
- Add authentication/authorization
- Log requests and errors
- Handle async operations properly
- Return consistent error responses

Generate code that follows the project's existing patterns and conventions.
