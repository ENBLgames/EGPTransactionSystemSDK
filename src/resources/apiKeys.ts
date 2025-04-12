import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import {
    ApiKeyCreateRequestSchema,
    ApiKeyResponseSchema,
    ApiKeyUpdateRequestSchema,
} from '../types/apiKey.types';
import type {
    ApiKeyCreateRequest,
    ApiKeyResponse,
    ApiKeyUpdateRequest,
} from '../types/apiKey.types';
import { z } from 'zod';

/**
 * Handles API Key management endpoints.
 * Note: These endpoints typically require JWT authentication (not API Key auth).
 */
export class ApiKeysAPI {
  private path = '/api-keys';

  constructor(private httpClient: HttpClient) {}

  /**
   * Creates a new API key.
   * IMPORTANT: The returned `key` field is only available in this response.
   * Store it securely immediately, as it cannot be retrieved again.
   * Requires JWT authentication.
   * @param {ApiKeyCreateRequest} keyData - Details for the new key.
   * @returns {Promise<ApiKeyResponse>} The created API key details, including the raw key.
   */
  async create(keyData: ApiKeyCreateRequest): Promise<ApiKeyResponse> {
    const validationResult = ApiKeyCreateRequestSchema.safeParse(keyData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid API key creation data', validationResult.error.issues);
    }
    // The handler wraps response in ApiResponse{data=...}, HttpClient should handle unwrapping
    const response = await this.httpClient.request<ApiKeyResponse>(
        this.path,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    // The ApiKeyResponseSchema handles the snake_case to camelCase transformation
    const parsedResponse = ApiKeyResponseSchema.parse(response); 

    // Manually check if the key is present after parsing
    if (!parsedResponse.key) {
        throw new ValidationError('API key secret was missing from the creation response.');
    }
    
    // We know key is present now, but TypeScript might not, so we return the parsed response.
    // If stricter typing is needed, we could refine the output type.
    return parsedResponse;
  }

  /**
   * Lists API keys for the authenticated user.
   * Keys are masked in the response.
   * Requires JWT authentication.
   * @returns {Promise<ApiKeyResponse[]>} Array of API key details (key omitted).
   */
  async list(): Promise<ApiKeyResponse[]> {
    // The handler wraps response in ApiResponse{data=...}, HttpClient should handle unwrapping
    const response = await this.httpClient.request<ApiKeyResponse[]>(this.path, { method: 'GET' });
    // Ensure response is an array and keys are omitted (which ApiKeyResponseSchema handles)
    return z.array(ApiKeyResponseSchema).parse(response);
  }

  /**
   * Gets details for a specific API key.
   * Key is masked in the response.
   * Requires JWT authentication.
   * @param {string} apiKeyId - The UUID of the API key.
   * @returns {Promise<ApiKeyResponse>} API key details (key omitted).
   */
  async getById(apiKeyId: string): Promise<ApiKeyResponse> {
    if (!apiKeyId) throw new ValidationError('API Key ID is required');
    // The handler wraps response in ApiResponse{data=...}, HttpClient should handle unwrapping
    const response = await this.httpClient.request<ApiKeyResponse>(`${this.path}/${apiKeyId}`, { method: 'GET' });
    return ApiKeyResponseSchema.parse(response);
  }

  /**
   * Updates an API key (e.g., name, status, permissions, expiry).
   * Requires JWT authentication.
   * @param {string} apiKeyId - The UUID of the API key to update.
   * @param {ApiKeyUpdateRequest} updateData - Fields to update.
   * @returns {Promise<ApiKeyResponse>} Updated API key details (key omitted).
   */
  async update(apiKeyId: string, updateData: ApiKeyUpdateRequest): Promise<ApiKeyResponse> {
    if (!apiKeyId) throw new ValidationError('API Key ID is required');
    const validationResult = ApiKeyUpdateRequestSchema.safeParse(updateData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid API key update data', validationResult.error.issues);
    }
     // The handler wraps response in ApiResponse{data=...}, HttpClient should handle unwrapping
    const response = await this.httpClient.request<ApiKeyResponse>(
        `${this.path}/${apiKeyId}`,
        {
            method: 'PATCH',
            body: validationResult.data,
        }
    );
    return ApiKeyResponseSchema.parse(response);
  }

  /**
   * Deletes (revokes) an API key.
   * Requires JWT authentication.
   * @param {string} apiKeyId - The UUID of the API key to delete.
   * @returns {Promise<void>}
   */
  async delete(apiKeyId: string): Promise<void> {
    if (!apiKeyId) throw new ValidationError('API Key ID is required');
    // Expecting 204 No Content or similar success response
    await this.httpClient.request<void>(`${this.path}/${apiKeyId}`, { method: 'DELETE' });
  }
} 