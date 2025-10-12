---
description: Perform security audit to identify vulnerabilities and risks
---

# Security Audit Command

Conduct a comprehensive security audit of the codebase to identify vulnerabilities, security risks, and compliance issues.

## Security Checklist

1. **Authentication & Authorization**
   - Password strength requirements
   - Session management
   - JWT token security
   - Role-based access control (RBAC)
   - OAuth implementation

2. **Input Validation**
   - SQL injection prevention
   - XSS (Cross-Site Scripting) protection
   - Command injection prevention
   - Path traversal protection
   - CSRF token validation

3. **Data Protection**
   - Sensitive data encryption
   - Password hashing (bcrypt, Argon2)
   - API key security
   - PII (Personally Identifiable Information) handling
   - Secure data transmission (HTTPS)

4. **Dependencies**
   - Outdated packages
   - Known vulnerabilities (npm audit, Snyk)
   - License compliance
   - Dependency confusion risks

5. **Configuration**
   - Environment variables security
   - Exposed secrets
   - Debug mode in production
   - Error message information leakage
   - CORS configuration

6. **Infrastructure**
   - Container security
   - Network security
   - Cloud resource permissions
   - Logging and monitoring
   - Backup and recovery

## Audit Output

Provide findings with:
- Severity level (Critical, High, Medium, Low)
- Description of the vulnerability
- Potential impact
- Recommended remediation
- Code examples for fixes
- References to security standards (OWASP, CWE)

Focus on practical, actionable security improvements.
