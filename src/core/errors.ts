/**
 * Base class for all SDK-specific errors.
 */
export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; // Ensure the name property is set correctly
    // Maintains proper stack trace in V8 environments (like Node.js/Bun)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error indicating a problem with the API request itself or the server's response
 * (e.g., non-2xx status code).
 */
export class APIError extends SDKError {
  public readonly status?: number;
  public readonly responseBody?: any;
  public readonly headers?: Headers;

  constructor(
    message: string,
    status?: number,
    responseBody?: any,
    headers?: Headers,
  ) {
    super(message);
    this.status = status;
    this.responseBody = responseBody;
    this.headers = headers;
  }
}

/**
 * Error indicating an issue with authentication (e.g., missing or invalid credentials).
 */
export class AuthenticationError extends SDKError {
  constructor(message: string = 'Authentication failed. Please check your API key or token.') {
    super(message);
  }
}

/**
 * Error indicating invalid input provided to an SDK method.
 * (Will be used more extensively when Zod validation is integrated).
 */
export class ValidationError extends SDKError {
  public readonly issues?: any; // Placeholder for more detailed validation issues (e.g., from Zod)

  constructor(message: string, issues?: any) {
    super(message);
    this.issues = issues;
  }
}

/**
 * Error indicating a network problem or an issue reaching the server.
 */
export class NetworkError extends SDKError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
} 