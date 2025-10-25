export class MCPError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
  
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      details: this.details
    };
  }
}

export class AuthenticationError extends MCPError {
  constructor(message: string = 'Invalid or revoked credential') {
    super('AUTH_ERROR', message, 401);
  }
}

export class AuthorizationError extends MCPError {
  constructor(message: string = 'Not authorized') {
    super('AUTHZ_ERROR', message, 403);
  }
}

export class RateLimitError extends MCPError {
  constructor(retryAfter: number) {
    super('RATE_LIMIT', 'Too many requests', 429, { retryAfter });
  }
}

export class ValidationError extends MCPError {
  constructor(field: string, message: string) {
    super('VALIDATION_ERROR', `${field}: ${message}`, 400, { field });
  }
}

export class NotFoundError extends MCPError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

