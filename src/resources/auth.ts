import { HttpClient } from '../core/httpClient';
import {
  UserRegistrationRequestSchema,
  UserRegistrationRequest,
  UserSchema,
  User,
  UserLoginRequestSchema,
  UserLoginRequest,
  TokenResponseSchema,
  TokenResponse,
  RefreshTokenRequestSchema,
  RefreshTokenRequest,
  PasswordChangeRequestSchema,
  PasswordChangeRequest,
  MessageResponseSchema,
  MessageResponse,
  // Import MFA schemas if implementing those methods
} from '../types/auth.types';
import { ValidationError } from '../core/errors';

/**
 * Handles authentication-related API endpoints.
 */
export class AuthAPI {
  private path = '/auth'; // Base path for auth endpoints

  constructor(private httpClient: HttpClient) {}

  /**
   * Registers a new user.
   * @param {UserRegistrationRequest} registrationData - User registration details.
   * @returns {Promise<User>} The created user details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., user already exists, server error).
   * @throws {NetworkError} For network issues.
   * @example
   * const newUser = await sdk.auth.register({
   *   username: 'newuser',
   *   email: 'new@example.com',
   *   password: 'Str0ngP@ssw0rd!',
   * });
   */
  async register(registrationData: UserRegistrationRequest): Promise<User> {
    const validationResult = UserRegistrationRequestSchema.safeParse(registrationData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid registration data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<User>(
        `${this.path}/register`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    // Ensure the response matches the expected schema (optional but recommended)
    return UserSchema.parse(response);
  }

  /**
   * Logs in a user.
   * @param {UserLoginRequest} loginData - User login credentials.
   * @returns {Promise<TokenResponse>} Authentication tokens and user info.
   * @throws {ValidationError} If input validation fails.
   * @throws {AuthenticationError} For invalid credentials or MFA required but not provided.
   * @throws {APIError} For other API-level errors.
   * @throws {NetworkError} For network issues.
   * @example
   * const tokens = await sdk.auth.login({
   *   email: 'user@example.com',
   *   password: 'password123',
   * });
   * // Check tokens.mfaRequired if MFA might be enabled
   */
  async login(loginData: UserLoginRequest): Promise<TokenResponse> {
    const validationResult = UserLoginRequestSchema.safeParse(loginData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid login data', validationResult.error.issues);
    }

    // Use mfaCode from loginData if present, otherwise call standard login
    const endpoint = loginData.mfaCode ? `${this.path}/mfa/verify` : `${this.path}/login`;

    const response = await this.httpClient.request<TokenResponse>(
        endpoint,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    // Ensure the response matches the expected schema
    return TokenResponseSchema.parse(response);
  }

  /**
   * Refreshes authentication tokens using a refresh token.
   * @param {RefreshTokenRequest} tokenData - The refresh token.
   * @returns {Promise<TokenResponse>} New authentication tokens.
   * @throws {ValidationError} If input validation fails.
   * @throws {AuthenticationError} For invalid or expired refresh token.
   * @throws {APIError} For other API-level errors.
   * @throws {NetworkError} For network issues.
   * @example
   * const newTokens = await sdk.auth.refresh({ refreshToken: 'old_refresh_token' });
   */
  async refresh(tokenData: RefreshTokenRequest): Promise<TokenResponse> {
    const validationResult = RefreshTokenRequestSchema.safeParse(tokenData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid refresh token data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TokenResponse>(
        `${this.path}/refresh`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    // Ensure the response matches the expected schema
    return TokenResponseSchema.parse(response);
  }

  /**
   * Changes the currently authenticated user's password.
   * Requires valid authentication (API Key or JWT) to be configured on the SDK client.
   * @param {PasswordChangeRequest} passwordData - Current and new password.
   * @returns {Promise<MessageResponse>} Success message.
   * @throws {ValidationError} If input validation fails.
   * @throws {AuthenticationError} If not authenticated or current password incorrect.
   * @throws {APIError} For other API-level errors.
   * @throws {NetworkError} For network issues.
   * @example
   * await sdk.auth.changePassword({
   *   currentPassword: 'oldPassword123',
   *   newPassword: 'NewS3cureP@ssw0rd!',
   * });
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<MessageResponse> {
    const validationResult = PasswordChangeRequestSchema.safeParse(passwordData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid password change data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<MessageResponse>(
        `${this.path}/change-password`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    // Ensure the response matches the expected schema
    return MessageResponseSchema.parse(response);
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   * Requires valid authentication (API Key or JWT) to be configured on the SDK client.
   * @returns {Promise<User>} The authenticated user's profile details.
   * @throws {AuthenticationError} If not authenticated.
   * @throws {APIError} For other API-level errors.
   * @throws {NetworkError} For network issues.
   * @example
   * const userProfile = await sdk.auth.getProfile();
   */
  async getProfile(): Promise<User> {
      const response = await this.httpClient.request<User>(`${this.path}/me`, { method: 'GET' });
      // Ensure the response matches the expected schema
      return UserSchema.parse(response);
  }

  // --- Placeholder for Logout ---
  /**
   * Logs out the user.
   * (Implementation details depend on server-side logic - e.g., invalidating refresh token)
   * Requires valid authentication (API Key or JWT) to be configured on the SDK client.
   * @returns {Promise<void>} Resolves when logout is complete.
   * @throws {AuthenticationError} If not authenticated.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   * @example
   * await sdk.auth.logout();
   */
   async logout(): Promise<void> {
    // The Go handler doesn't seem to take a body or return content.
    // It might rely on middleware/auth service to invalidate something based on the JWT.
    await this.httpClient.request<void>(`${this.path}/logout`, {
        method: 'POST',
        // No body needed based on handler structure
    });
    // No response body expected
  }

  // --- MFA Methods (To be implemented if needed) ---
  // async verifyMfa(verificationData: MfaVerifyRequest): Promise<TokenResponse> { ... }
  // async setupMfa(): Promise<MfaSetupResponse> { ... }
  // async enableMfa(enableData: MfaEnableRequest): Promise<MessageResponse> { ... }
  // async disableMfa(disableData: MfaDisableRequest): Promise<MessageResponse> { ... }
  // async getMfaStatus(): Promise<MfaStatusResponse> { ... }
} 