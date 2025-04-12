import { APIError, AuthenticationError, NetworkError, SDKError } from './errors';

/**
 * Configuration options for the HttpClient.
 */
export interface HttpClientConfig {
  baseURL: string;
  apiKey?: string;
  authToken?: string; // e.g., JWT Bearer token
  organizationId?: string; // Added for API Key context
  defaultHeaders?: Record<string, string>;
  timeout?: number; // milliseconds
}

/**
 * Options for a single HTTP request.
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  body?: any; // Can be anything JSON.stringify can handle, or FormData, etc.
  headers?: Record<string, string>;
  signal?: AbortSignal; // For request cancellation
  expectedStatus?: number; // Added for expected non-ok status
}

/**
 * A wrapper around the native fetch API to handle common SDK requirements like
 * base URL, authentication, JSON parsing, and error handling.
 */
export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    if (!config.baseURL) {
      throw new SDKError('baseURL is required in HttpClientConfig');
    }
    // Add validation for apiKey/organizationId pairing
    if (config.apiKey && !config.organizationId) {
        console.warn('Warning: apiKey provided without organizationId. Most API Key endpoints require X-Organization-ID.');
        // Consider throwing an error if it's strictly required:
        // throw new SDKError('organizationId is required when using apiKey');
    }

    // Ensure baseURL doesn't end with a slash to prevent double slashes
    this.config = {
      ...config,
      baseURL: config.baseURL.replace(/\/$/, ''),
      defaultHeaders: { 'Content-Type': 'application/json', ...config.defaultHeaders },
    };
  }

  /**
   * Makes an HTTP request.
   * @param path - The API path (e.g., '/users/me').
   * @param options - Request options (method, body, queryParams, headers).
   * @returns A promise resolving to the parsed JSON response body.
   * @throws {AuthenticationError} If credentials are missing when required.
   * @throws {APIError} If the server returns a non-2xx status code.
   * @throws {NetworkError} If there's a network issue or timeout.
   * @throws {SDKError} For other client-side errors (e.g., JSON parsing failure).
   */
  public async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', queryParams, body, headers: requestHeaders, signal, expectedStatus } = options as RequestOptions & { expectedStatus?: number };

    // Construct URL
    const url = new URL(this.config.baseURL + (path.startsWith('/') ? path : `/${path}`));
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare headers
    const headers = new Headers({ ...this.config.defaultHeaders, ...requestHeaders });

    // --- Authentication & Organization --- //
    if (this.config.apiKey) {
      // Use API Key authentication
      headers.set('X-API-Key', this.config.apiKey);
      if (this.config.organizationId) {
          headers.set('X-Organization-ID', this.config.organizationId);
      } else {
           console.warn(`Making API Key request without X-Organization-ID header for path: ${path}. This may be required.`);
      }
      // Ensure Authorization header is not set if using API Key
      headers.delete('Authorization'); 
    } else if (this.config.authToken) {
      // Use JWT authentication
      headers.set('Authorization', `Bearer ${this.config.authToken}`);
       // Optionally set Org ID if provided and not already set by API Key logic
       if (this.config.organizationId && !headers.has('X-Organization-ID')) {
           headers.set('X-Organization-ID', this.config.organizationId);
       }
    } // else: No authentication configured
    // --- End Authentication & Organization ---

    // Prepare body
    let requestBody: any | null = null;
    if (body) {
      if (body instanceof FormData || typeof body === 'string' || body instanceof URLSearchParams || body instanceof Blob) {
        requestBody = body;
        headers.delete('Content-Type');
      } else {
        try {
          requestBody = JSON.stringify(body);
          if (!headers.has('Content-Type')) {
             headers.set('Content-Type', 'application/json');
          }
        } catch (error) {
          throw new SDKError('Failed to stringify request body as JSON');
        }
      }
    }

    // Setup timeout
    const controller = new AbortController();
    const timeoutSignal = this.config.timeout ? AbortSignal.timeout(this.config.timeout) : null;
    const combinedSignal = this.getCombinedSignal(signal, controller.signal, timeoutSignal);

    // --- REMOVED TEMPORARY LOGGING START ---
    // if (path === '/wallets' && method === 'POST') { ... logging code ... }
    // --- REMOVED TEMPORARY LOGGING END ---

    // Make the request
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: requestBody,
        signal: combinedSignal,
      });
    } catch (error: any) {
        if (error.name === 'TimeoutError' || (error instanceof DOMException && error.name === 'AbortError' && timeoutSignal?.aborted) ) {
             throw new NetworkError(`Request timed out after ${this.config.timeout}ms`, error);
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
             throw new SDKError(`Request aborted: ${error.message}`);
        }
        throw new NetworkError(`Network request failed: ${error.message}`, error);
    }

    // Handle error response
    if (!response.ok) {
        if (expectedStatus && response.status === expectedStatus) {
             // Continue
        } else {
            let errorBody: any = null;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                errorBody = await response.json();
                } else {
                errorBody = await response.text();
                }
            } catch (parseError) { /* Ignore */ }

            const errorMessage = errorBody?.message || errorBody?.error || (typeof errorBody === 'string' ? errorBody : response.statusText);

            if (response.status === 401 || response.status === 403) {
                throw new AuthenticationError(`Authentication failed: ${errorMessage}`);
            }

            throw new APIError(
                `API request failed with status ${response.status}: ${errorMessage}`,
                response.status,
                errorBody,
                response.headers
            );
        }
    }

    // --- Handle successful response --- //
    try {
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return undefined as T;
      }

      // --- REVERTED TEMPORARY LOGGING START ---
      // const rawText = await response.text(); // Get raw text first
      // if (path === '/organizations' && method === 'POST') {
      //     console.log("[DEBUG] Raw response for POST /organizations:", rawText);
      // }
      // const responseBody = JSON.parse(rawText); // Parse the raw text
      const responseBody = await response.json(); // Reverted to original
      // --- REVERTED TEMPORARY LOGGING END ---

      // Type guard for the wrapper structure
      const isSuccessWrapper = (
          res: any
      ): res is { success: true; data: T } => {
          return (
              typeof res === 'object' &&
              res !== null &&
              typeof res.success === 'boolean' &&
              res.success === true &&
              res.hasOwnProperty('data')
          );
      };

      if (isSuccessWrapper(responseBody)) {
          return responseBody.data;
      }
      else if (expectedStatus && response.status === expectedStatus) {
          return responseBody as T;
      }
      else if (response.ok && (!expectedStatus || response.status === expectedStatus)) {
          return responseBody as T;
      }
        else {
             throw new SDKError(`Unexpected successful response structure or status mismatch. Status: ${response.status}, Expected: ${expectedStatus ?? '2xx'}`);
        }

    } catch (error: any) {
        if (error instanceof SDKError || error instanceof APIError || error instanceof AuthenticationError || error instanceof NetworkError) {
            throw error;
        }
         throw new SDKError(`Failed to parse response body as JSON or unexpected structure: ${error.message}`);
    }
    // --- End Handle successful response --- //
  }

  /**
   * Combines multiple AbortSignals.
   * The resulting signal will abort if any of the input signals abort.
   */
  private getCombinedSignal(...signals: (AbortSignal | null | undefined)[]): AbortSignal | undefined {
    const validSignals = signals.filter((s): s is AbortSignal => s != null);
    if (validSignals.length === 0) return undefined;
    if (validSignals.length === 1) return validSignals[0];

    const controller = new AbortController();
    const onAbort = () => {
      controller.abort();
      cleanup();
    };

    const cleanup = () => {
       validSignals.forEach(s => s.removeEventListener('abort', onAbort));
    }

    validSignals.forEach(s => {
      if (s.aborted) {
        controller.abort();
      } else {
        s.addEventListener('abort', onAbort);
      }
    });

    return controller.signal;
  }
} 