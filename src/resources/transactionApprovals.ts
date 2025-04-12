import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import { z } from 'zod';
import {
    ApprovalListParamsSchema,
    ApprovalListParams,
    PaginatedApprovalResponseSchema,
    PaginatedApprovalResponse,
    TransactionApprovalResponseSchema,
    TransactionApprovalResponse,
    ApproveTransactionRequestSchema,
    ApproveTransactionRequest,
    RejectTransactionRequestSchema,
    RejectTransactionRequest,
    RequestApprovalRequestSchema,
    RequestApprovalRequest
} from '../types/transactionApproval.types';

/**
 * Handles transaction approval related API endpoints.
 */
export class TransactionApprovalsAPI {
  private path = '/transaction-approvals';

  constructor(private httpClient: HttpClient) {}

  /**
   * Lists pending transaction approvals for the authenticated user/organization.
   * Requires `transaction:approve` permission.
   * @param {ApprovalListParams} [params] - Pagination parameters.
   * @returns {Promise<PaginatedApprovalResponse>} Paginated list of pending approvals.
   * @throws {ValidationError} If params validation fails.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async listPending(params?: ApprovalListParams): Promise<PaginatedApprovalResponse> {
    const validationResult = ApprovalListParamsSchema.safeParse(params || {});
    if (!validationResult.success) {
      throw new ValidationError('Invalid list parameters', validationResult.error.issues);
    }

    const response = await this.httpClient.request<PaginatedApprovalResponse>(
        `${this.path}`,
        {
            method: 'GET',
            queryParams: validationResult.data,
        }
    );
    // The actual response might be PaginatedResponse { data: Approval[] }, ensure schema matches API
    return PaginatedApprovalResponseSchema.parse(response);
  }

  /**
   * Retrieves details for a specific transaction approval request.
   * Requires `transaction:approve` permission.
   * @param {string} approvalId - The UUID of the approval request.
   * @returns {Promise<TransactionApprovalResponse>} Approval details.
   * @throws {ValidationError} If ID is missing.
   * @throws {APIError} For API-level errors (e.g., not found, permission denied).
   * @throws {NetworkError} For network issues.
   */
  async getById(approvalId: string): Promise<TransactionApprovalResponse> {
    if (!approvalId) throw new ValidationError('Approval ID is required');
    const response = await this.httpClient.request<TransactionApprovalResponse>(`${this.path}/${approvalId}`, { method: 'GET' });
    return TransactionApprovalResponseSchema.parse(response);
  }

  /**
   * Lists all approval requests (pending, approved, rejected) for a specific transaction.
   * Requires `transaction:read` permission.
   * @param {string} transactionId - The UUID of the transaction.
   * @returns {Promise<TransactionApprovalResponse[]>} List of approval details.
   * @throws {ValidationError} If ID is missing.
   * @throws {APIError} For API-level errors.
   * @throws {NetworkError} For network issues.
   */
  async listByTransaction(transactionId: string): Promise<TransactionApprovalResponse[]> {
    if (!transactionId) throw new ValidationError('Transaction ID is required');
    // The API returns a direct array, not a paginated response
    const response = await this.httpClient.request<TransactionApprovalResponse[]>(`${this.path}/transaction/${transactionId}`, { method: 'GET' });
    // Validate each item in the array
    return z.array(TransactionApprovalResponseSchema).parse(response);
  }

  /**
   * Approves a pending transaction approval request.
   * Requires `transaction:approve` permission.
   * @param {ApproveTransactionRequest} approvalData - Approval ID and optional notes.
   * @returns {Promise<TransactionApprovalResponse>} The updated approval details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., not found, already actioned, permission denied).
   * @throws {NetworkError} For network issues.
   */
  async approve(approvalData: ApproveTransactionRequest): Promise<TransactionApprovalResponse> {
    const validationResult = ApproveTransactionRequestSchema.safeParse(approvalData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid approval data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionApprovalResponse>(
        `${this.path}/approve`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionApprovalResponseSchema.parse(response);
  }

  /**
   * Rejects a pending transaction approval request.
   * Requires `transaction:approve` permission.
   * @param {RejectTransactionRequest} rejectionData - Approval ID and optional reason.
   * @returns {Promise<TransactionApprovalResponse>} The updated approval details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., not found, already actioned, permission denied).
   * @throws {NetworkError} For network issues.
   */
  async reject(rejectionData: RejectTransactionRequest): Promise<TransactionApprovalResponse> {
    const validationResult = RejectTransactionRequestSchema.safeParse(rejectionData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid rejection data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionApprovalResponse>(
        `${this.path}/reject`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionApprovalResponseSchema.parse(response);
  }

  /**
   * Manually requests approval for an existing transaction.
   * Requires `transaction:create` permission.
   * @param {RequestApprovalRequest} requestData - Transaction ID and optional notes.
   * @returns {Promise<TransactionApprovalResponse>} The newly created approval request details.
   * @throws {ValidationError} If input validation fails.
   * @throws {APIError} For API-level errors (e.g., transaction not found, already approved/rejected, approval not required).
   * @throws {NetworkError} For network issues.
   */
  async request(requestData: RequestApprovalRequest): Promise<TransactionApprovalResponse> {
    const validationResult = RequestApprovalRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid approval request data', validationResult.error.issues);
    }

    const response = await this.httpClient.request<TransactionApprovalResponse>(
        `${this.path}/request`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionApprovalResponseSchema.parse(response);
  }
} 