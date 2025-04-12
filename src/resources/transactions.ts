import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import { formatQueryParams } from '../core/utils';
import {
    TransactionCreateRequestSchema,
    TransactionCreateRequest,
    TransactionResponseSchema,
    TransactionResponse,
    TransactionListParamsSchema,
    TransactionListParams,
    TransactionListResponseSchema,
    TransactionListResponse,
    TransactionStatusQueryParamsSchema,
    TransactionStatusQueryParams,
    TransactionStatusResponseSchema,
    TransactionStatusResponse,
    SendTransactionRequestSchema,
    SendTransactionRequest,
    FeeEstimateRequestSchema,
    FeeEstimateRequest,
    FeeEstimateResponseSchema,
    FeeEstimateResponse,
    TrackTransactionRequestSchema,
    TrackTransactionRequest
} from '../types/transaction.types';

/**
 * Handles transaction-related API endpoints.
 */
export class TransactionsAPI {
  private path = '/transactions';

  constructor(private httpClient: HttpClient) {}

  /**
   * Creates a new transaction record in the system (does not send to blockchain).
   * Requires `transaction:create` permission.
   * @param {TransactionCreateRequest} txData - Transaction details.
   * @returns {Promise<TransactionResponse>} The created transaction record.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., permission denied, invalid wallet).
   * @throws {NetworkError} For network issues.
   */
  async create(txData: TransactionCreateRequest): Promise<TransactionResponse> {
    const validationResult = TransactionCreateRequestSchema.safeParse(txData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid transaction creation data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionResponse>(
        `${this.path}`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionResponseSchema.parse(response);
  }

  /**
   * Lists transactions based on specified filters.
   * Requires `transaction:read` permission.
   * @param {TransactionListParams} [params] - Filtering and pagination parameters.
   * @returns {Promise<TransactionListResponse>} A list of transactions and the total count.
   * @throws {ValidationError} If params validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async list(params?: TransactionListParams): Promise<TransactionListResponse> {
    const validationResult = TransactionListParamsSchema.safeParse(params || {});
     if (!validationResult.success) {
        throw new ValidationError('Invalid list parameters', validationResult.error.issues);
    }
    const formattedParams = formatQueryParams(validationResult.data);

    const response = await this.httpClient.request<TransactionListResponse>(
        `${this.path}`,
        {
            method: 'GET',
            queryParams: formattedParams,
        }
    );
    return TransactionListResponseSchema.parse(response);
  }

  /**
   * Retrieves a transaction by its internal system ID.
   * Requires `transaction:read` permission.
   * @param {string} transactionId - The UUID of the transaction.
   * @returns {Promise<TransactionResponse>} Transaction details.
   * @throws {ValidationError} If ID is missing.
   * @throws {APIError} For API-level errors (e.g., not found).
   * @throws {NetworkError} For network issues.
   */
  async getById(transactionId: string): Promise<TransactionResponse> {
    if (!transactionId) throw new ValidationError('Transaction ID is required');
    const response = await this.httpClient.request<TransactionResponse>(`${this.path}/${transactionId}`, { method: 'GET' });
    return TransactionResponseSchema.parse(response);
  }

  /**
   * Retrieves a transaction by its blockchain hash.
   * Requires `transaction:read` permission.
   * @param {string} txHash - The blockchain transaction hash.
   * @returns {Promise<TransactionResponse>} Transaction details.
   * @throws {ValidationError} If hash is missing.
   * @throws {APIError} For API-level errors (e.g., not found).
   * @throws {NetworkError} For network issues.
   */
  async getByHash(txHash: string): Promise<TransactionResponse> {
    if (!txHash) throw new ValidationError('Transaction hash is required');
    const response = await this.httpClient.request<TransactionResponse>(`${this.path}/hash/${txHash}`, { method: 'GET' });
    return TransactionResponseSchema.parse(response);
  }

  /**
   * Lists transactions associated with a specific wallet.
   * Requires `wallet:read` permission for the specified wallet.
   * @param {string} walletId - The UUID of the wallet.
   * @param {Omit<TransactionListParams, 'walletId'>} [params] - Filtering and pagination parameters (excluding walletId).
   * @returns {Promise<TransactionListResponse>} A list of transactions and the total count.
   * @throws {ValidationError} If walletId is missing or params validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
   async listByWallet(walletId: string, params?: Omit<TransactionListParams, 'walletId'>): Promise<TransactionListResponse> {
    if (!walletId) throw new ValidationError('Wallet ID is required');
    // Validate params excluding walletId
    const validationResult = TransactionListParamsSchema.omit({ walletId: true }).safeParse(params || {});
     if (!validationResult.success) {
        throw new ValidationError('Invalid list parameters', validationResult.error.issues);
    }
    const formattedParams = formatQueryParams(validationResult.data);

    const response = await this.httpClient.request<TransactionListResponse>(
        `${this.path}/wallet/${walletId}`,
        {
            method: 'GET',
            queryParams: formattedParams,
        }
    );
    return TransactionListResponseSchema.parse(response);
  }

  /**
   * Retrieves the status of a transaction by its ID or hash.
   * Requires `transaction:read` permission.
   * @param {TransactionStatusQueryParams} params - Either the transaction ID or hash.
   * @returns {Promise<TransactionStatusResponse>} Transaction status details.
   * @throws {ValidationError} If params validation fails (neither id nor txHash provided).
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async getStatus(params: TransactionStatusQueryParams): Promise<TransactionStatusResponse> {
    const validationResult = TransactionStatusQueryParamsSchema.safeParse(params);
    if (!validationResult.success) {
      throw new ValidationError('Invalid status query parameters', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionStatusResponse>(
        `${this.path}/status`,
        {
            method: 'GET',
            queryParams: validationResult.data, // Send { id: '...' } or { txHash: '...' }
        }
    );
    return TransactionStatusResponseSchema.parse(response);
  }

  /**
   * Initiates the process to send (broadcast) a transaction.
   * This may involve approval workflows depending on permissions and limits.
   * Requires transaction send permission.
   * @param {SendTransactionRequest} sendData - Details of the transaction to send.
   * @returns {Promise<TransactionResponse>} The transaction record, potentially updated status (e.g., pending, awaiting_approval).
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., permission denied, limits exceeded).
   * @throws {NetworkError} For network issues.
   */
  async send(sendData: SendTransactionRequest): Promise<TransactionResponse> {
    const validationResult = SendTransactionRequestSchema.safeParse(sendData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid send transaction data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionResponse>(
        `${this.path}/send`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionResponseSchema.parse(response);
  }

  /**
   * Sends/Broadcasts a previously created transaction record by its ID.
   * Requires transaction send permission.
   * @param {string} transactionId - The UUID of the transaction record to send.
   * @returns {Promise<TransactionResponse>} The transaction record with updated status.
   * @throws {ValidationError} If ID is missing.
   * @throws {APIError} For API-level errors (e.g., not found, already sent, permission denied).
   * @throws {NetworkError} For network issues.
   */
  async commitSend(transactionId: string): Promise<TransactionResponse> {
    if (!transactionId) throw new ValidationError('Transaction ID is required');

    const response = await this.httpClient.request<TransactionResponse>(
        `${this.path}/commit-send/${transactionId}`,
        {
            method: 'POST',
            // No body needed for this endpoint
        }
    );
    return TransactionResponseSchema.parse(response);
  }

  /**
   * Estimates the fee for a potential transaction.
   * Requires `transaction:read` permission.
   * @param {FeeEstimateRequest} estimateData - Details of the transaction to estimate fee for.
   * @returns {Promise<FeeEstimateResponse>} Estimated fee details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async estimateFee(estimateData: FeeEstimateRequest): Promise<FeeEstimateResponse> {
    const validationResult = FeeEstimateRequestSchema.safeParse(estimateData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid fee estimation data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<FeeEstimateResponse>(
        `${this.path}/estimate-fee`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return FeeEstimateResponseSchema.parse(response);
  }

  /**
   * Tracks an externally created transaction by its hash.
   * Requires `transaction:read` permission.
   * @param {TrackTransactionRequest} trackData - Transaction hash and blockchain details.
   * @returns {Promise<TransactionResponse>} The newly tracked transaction record.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async track(trackData: TrackTransactionRequest): Promise<TransactionResponse> {
    const validationResult = TrackTransactionRequestSchema.safeParse(trackData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid track transaction data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionResponse>(
        `${this.path}/track`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionResponseSchema.parse(response);
  }

  // --- Placeholder for Confirm Transaction ---
  /**
   * Confirms a transaction (Purpose TBD - might relate to approvals).
   * Requires `transaction:approve` permission.
   * @param {string} transactionId - The UUID of the transaction to confirm.
   * @returns {Promise<any>} Response details TBD.
   * @throws {ValidationError} If ID is missing.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async confirm(transactionId: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!transactionId) throw new ValidationError('Transaction ID is required');
    // Implementation depends on the actual request/response of this endpoint
    return this.httpClient.request<any>(
        `${this.path}/${transactionId}/confirm`,
        {
            method: 'POST',
            // Request body? Response type?
        }
    );
  }
} 