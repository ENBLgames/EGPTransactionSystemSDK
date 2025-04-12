import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import {
    WalletSchema,
    Wallet,
    WalletCreateRequestSchema,
    WalletCreateRequest,
    WalletListParamsSchema,
    WalletListParams,
    WalletListResponseSchema,
    WalletListResponse,
    WalletUpdateRequestSchema,
    WalletUpdateRequest,
    WalletBalanceResponseSchema,
    WalletBalanceResponse,
    WalletTransactionListParamsSchema,
    WalletTransactionListParams,
    WalletTransactionListResponseSchema,
    WalletTransactionListResponse,
    SignDataRequestBase64Schema, // Using Base64 version for simplicity
    SignDataRequestBase64,
    SignDataResponseSchema,
    SignDataResponse,
    WebhookCreateRequestSchema,
    WebhookCreateRequest,
    WebhookResponseSchema,
    WebhookResponse,
    WalletStatsResponseSchema,
    WalletStatsResponse,
    WalletResponseSchema,
    WalletResponse
} from '../types/wallet.types';
import type { MessageResponseSchema, MessageResponse } from '../types/auth.types';
import { Buffer } from 'buffer'; // Needed for Base64 encoding
import type { SDKOptions } from '../client';
import { Paginated, PaginatedResponseSchema } from '../types/pagination.types';

/**
 * Handles wallet-related API endpoints.
 */
export class WalletsAPI {
  private path = '/wallets';

  constructor(private httpClient: HttpClient) {}

  /**
   * Creates a new blockchain wallet.
   *
   * @async
   * @function create
   * @memberof WalletsAPI
   * @param {WalletCreateRequest} walletData - Details for the new wallet (name, type, metadata).
   * @returns {Promise<Wallet>} A promise that resolves with the details of the created wallet.
   * @throws {ValidationError} If the input `walletData` is invalid (e.g., missing name, invalid type).
   * @throws {APIError} If the API returns an error (e.g., authentication failure, internal server error).
   * @throws {NetworkError} If there's a network issue connecting to the API.
   *
   * @example
   * ```typescript
   * try {
   *   const newWallet = await sdk.wallets.create({
   *     name: 'My First HD Wallet',
   *     type: 'HD'
   *   });
   *   console.log('Wallet created:', newWallet.id);
   * } catch (error) {
   *   console.error('Failed to create wallet:', error);
   * }
   * ```
   */
  async create(walletData: WalletCreateRequest): Promise<Wallet> {
    const validationResult = WalletCreateRequestSchema.safeParse(walletData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid wallet creation data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<Wallet>(
        `${this.path}`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return WalletSchema.parse(response);
  }

  /**
   * Lists wallets accessible to the authenticated user.
   * Requires authentication.
   * @param {WalletListParams} [params] - Optional pagination parameters (limit, offset).
   * @returns {Promise<WalletListResponse>} A list of wallets and the total count.
   * @throws {ValidationError} If params validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async list(params?: WalletListParams): Promise<WalletListResponse> {
    const validatedParams = params ? WalletListParamsSchema.parse(params) : {};

    const response = await this.httpClient.request<WalletListResponse>(
        `${this.path}`,
        {
            method: 'GET',
            queryParams: validatedParams,
        }
    );
    return WalletListResponseSchema.parse(response);
  }

  /**
   * Retrieves details for a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet to retrieve.
   * @returns {Promise<Wallet>} Wallet details.
   * @throws {APIError} For API-level errors (e.g., not found, permission denied).
   * @throws {NetworkError} For network issues.
   */
  async getById(walletId: string): Promise<Wallet> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const response = await this.httpClient.request<Wallet>(`${this.path}/${walletId}`, { method: 'GET' });
    return WalletSchema.parse(response);
  }

  /**
   * Updates a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet to update.
   * @param {WalletUpdateRequest} updateData - Fields to update.
   * @returns {Promise<Wallet>} The updated wallet details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async update(walletId: string, updateData: WalletUpdateRequest): Promise<Wallet> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const validationResult = WalletUpdateRequestSchema.safeParse(updateData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid wallet update data', validationResult.error.issues);
    }
    if (Object.keys(validationResult.data).length === 0) {
        throw new ValidationError('At least one field must be provided for update');
    }

    // Using PATCH as it's more appropriate for partial updates
    const response = await this.httpClient.request<Wallet>(
        `${this.path}/${walletId}`,
        {
            method: 'PATCH',
            body: validationResult.data,
        }
    );
    return WalletSchema.parse(response);
  }

  /**
   * Deletes a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet to delete.
   * @returns {Promise<void>} Resolves on successful deletion.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async delete(walletId: string): Promise<void> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    await this.httpClient.request<void>(`${this.path}/${walletId}`, { method: 'DELETE' });
    // Expecting 204 No Content or similar
  }

  /**
   * Gets the balance for a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet.
   * @returns {Promise<WalletBalanceResponse>} Wallet balance details.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async getBalance(walletId: string): Promise<WalletBalanceResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const response = await this.httpClient.request<WalletBalanceResponse>(`${this.path}/${walletId}/balance`, { method: 'GET' });
    return WalletBalanceResponseSchema.parse(response);
  }

  /**
   * Lists transactions associated with a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet.
   * @param {WalletTransactionListParams} [params] - Optional pagination and filtering parameters.
   * @returns {Promise<WalletTransactionListResponse>} A list of transactions and the total count.
   * @throws {ValidationError} If params validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async listTransactions(walletId: string, params?: WalletTransactionListParams): Promise<WalletTransactionListResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const validatedParams = params ? WalletTransactionListParamsSchema.parse(params) : {};

    const response = await this.httpClient.request<WalletTransactionListResponse>(
        `${this.path}/${walletId}/transactions`,
        {
            method: 'GET',
            queryParams: validatedParams,
        }
    );
    return WalletTransactionListResponseSchema.parse(response);
  }

  /**
   * Signs data using the wallet's private key.
   * Requires authentication.
   * Accepts either a raw message string or a base64 encoded data string.
   * @param {string} walletId - The UUID of the wallet to sign with.
   * @param {SignDataRequestBase64} signRequest - The data or message to sign.
   * @returns {Promise<SignDataResponse>} The signature and wallet ID.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., wallet not found, signing error).
   * @throws {NetworkError} For network issues.
   */
  async signData(walletId: string, signRequest: SignDataRequestBase64): Promise<SignDataResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const validationResult = SignDataRequestBase64Schema.safeParse(signRequest);
    if (!validationResult.success) {
      throw new ValidationError('Invalid signing request data', validationResult.error.issues);
    }

    // The Go handler expects `data` as []byte or `message` as string.
    // We'll send the base64 data string as `data` if provided, otherwise send `message`.
    // Server side needs to handle decoding base64 if `data` is received.
    const bodyToSend: { data?: string; message?: string } = {};
    if (validationResult.data.data) {
        bodyToSend.data = validationResult.data.data; // Send as base64 string
    } else {
        bodyToSend.message = validationResult.data.message;
    }

    const response = await this.httpClient.request<SignDataResponse>(
        `${this.path}/${walletId}/sign`,
        {
            method: 'POST',
            body: bodyToSend,
        }
    );
    return SignDataResponseSchema.parse(response);
  }

   /**
    * Signs a message string using the wallet's private key.
    * Convenience method for signing human-readable strings.
    * Requires authentication.
    * @param {string} walletId - The UUID of the wallet to sign with.
    * @param {string} message - The message string to sign.
    * @returns {Promise<SignDataResponse>} The signature and wallet ID.
    * @throws {ValidationError} If input validation fails.
    * @throws {APIError} For API-level errors.
    * @throws {NetworkError} For network issues.
    */
    async signMessage(walletId: string, message: string): Promise<SignDataResponse> {
        if (!message) throw new ValidationError('Message is required for signing');
        return this.signData(walletId, { message });
    }

    /**
     * Signs raw byte data using the wallet's private key.
     * Requires authentication.
     * @param {string} walletId - The UUID of the wallet to sign with.
     * @param {Uint8Array} data - The raw byte data to sign.
     * @returns {Promise<SignDataResponse>} The signature and wallet ID.
     * @throws {ValidationError} If input validation fails.
     * @throws {APIError} For API-level errors.
     * @throws {NetworkError} For network issues.
     */
    async signRawData(walletId: string, data: Uint8Array): Promise<SignDataResponse> {
        if (!data || data.length === 0) throw new ValidationError('Data is required for signing');
        // Convert Uint8Array to base64 string for JSON transport
        const base64Data = Buffer.from(data).toString('base64');
        return this.signData(walletId, { data: base64Data });
    }

  /**
   * Registers a webhook for events related to a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet.
   * @param {WebhookCreateRequest} webhookData - Webhook configuration.
   * @returns {Promise<WebhookResponse>} The created webhook details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async registerWebhook(walletId: string, webhookData: WebhookCreateRequest): Promise<WebhookResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const validationResult = WebhookCreateRequestSchema.safeParse(webhookData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid webhook creation data', validationResult.error.issues);
    }

    // The handler expects resourceType and resourceId implicitly from the path
    const bodyToSend = {
        eventTypes: validationResult.data.eventTypes,
        url: validationResult.data.url,
        secret: validationResult.data.secret,
        active: validationResult.data.active,
    };

    const response = await this.httpClient.request<WebhookResponse>(
        `${this.path}/${walletId}/webhook`,
        {
            method: 'POST',
            body: bodyToSend,
        }
    );
    return WebhookResponseSchema.parse(response);
  }

  /**
   * Gets statistics for a specific wallet.
   * Requires authentication.
   * @param {string} walletId - The UUID of the wallet.
   * @returns {Promise<WalletStatsResponse>} Wallet statistics.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async getStats(walletId: string): Promise<WalletStatsResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    const response = await this.httpClient.request<WalletStatsResponse>(`${this.path}/${walletId}/stats`, { method: 'GET' });
    return WalletStatsResponseSchema.parse(response);
  }

  // Note: Superadmin ListAllWallets endpoint is not included here as it requires special permissions.
  // It could be added to a separate SuperAdminAPI class if needed.
} 