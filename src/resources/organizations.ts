import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import { formatQueryParams } from '../core/utils';
import {
    OrganizationCreateRequestSchema,
    OrganizationCreateRequest,
    OrganizationResponseSchema,
    OrganizationResponse,
    OrganizationListParamsSchema,
    OrganizationListParams,
    OrganizationListResponseSchema,
    OrganizationListResponse,
    OrganizationUpdateRequestSchema,
    OrganizationUpdateRequest,
    OrganizationMemberCreateRequestSchema,
    OrganizationMemberCreateRequest,
    OrganizationMemberResponseSchema,
    OrganizationMemberResponse,
    OrganizationMemberListParamsSchema,
    OrganizationMemberListParams,
    OrganizationMemberListResponseSchema,
    OrganizationMemberListResponse,
    OrganizationMemberUpdateRequestSchema,
    OrganizationMemberUpdateRequest,
    DeployBalanceWalletRequestSchema,
    DeployBalanceWalletRequest,
    DeployBalanceWalletResponseSchema,
    DeployBalanceWalletResponse,
    BalanceWalletListParamsSchema,
    BalanceWalletListParams,
    BalanceWalletListResponseSchema,
    BalanceWalletListResponse,
    UpdateBalanceWalletRequestSchema,
    UpdateBalanceWalletRequest,
    UpdateBalanceWalletResponseSchema,
    UpdateBalanceWalletResponse
} from '../types/organization.types';
import { z } from 'zod';

/**
 * Handles organization and member related API endpoints.
 */
export class OrganizationsAPI {
  private basePath = '/organizations';
  private balanceWalletPath = '/organizations/OrganizationBalancesWalletUpgradeable'; // Specific path for balance wallets

  constructor(private httpClient: HttpClient) {}

  // --- Organization Management --- (/organizations)

  /**
   * Creates a new organization.
   * The calling user becomes the owner.
   * @param {OrganizationCreateRequest} orgData - Organization details.
   * @returns {Promise<OrganizationResponse>} The created organization.
   */
  async create(orgData: OrganizationCreateRequest): Promise<OrganizationResponse> {
    const validationResult = OrganizationCreateRequestSchema.safeParse(orgData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid organization creation data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<OrganizationResponse>(
        this.basePath,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return OrganizationResponseSchema.parse(response);
  }

  /**
   * Lists organizations accessible to the user.
   * @param {OrganizationListParams} [params] - Pagination and search parameters.
   * @returns {Promise<OrganizationListResponse>} Paginated list of organizations.
   */
  async list(params?: OrganizationListParams): Promise<OrganizationListResponse> {
    const validationResult = OrganizationListParamsSchema.safeParse(params || {});
    if (!validationResult.success) {
        throw new ValidationError('Invalid list parameters', validationResult.error.issues);
    }
    // Convert page/limit for 0-based offset if API expects that
    const queryParams: Record<string, any> = { ...validationResult.data };
    if (queryParams.page !== undefined) {
        // Assuming API uses 0-based offset, calculate from 1-based page
        queryParams.offset = ((queryParams.page || 1) - 1) * (queryParams.limit || 10); // Default limit 10 if not set
        delete queryParams.page; // Remove page as API might expect offset
    }
    const formattedParams = formatQueryParams(queryParams);

    const response = await this.httpClient.request<OrganizationListResponse>(
        this.basePath,
        {
            method: 'GET',
            queryParams: formattedParams,
        }
    );
    return OrganizationListResponseSchema.parse(response);
  }

  /**
   * Gets details for a specific organization.
   * @param {string} organizationId - The UUID of the organization.
   * @returns {Promise<OrganizationResponse>} Organization details.
   */
  async getById(organizationId: string): Promise<OrganizationResponse> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    const response = await this.httpClient.request<OrganizationResponse>(`${this.basePath}/${organizationId}`, { method: 'GET' });
    return OrganizationResponseSchema.parse(response);
  }

  /**
   * Updates an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {OrganizationUpdateRequest} updateData - Fields to update.
   * @returns {Promise<OrganizationResponse>} The updated organization.
   */
  async update(organizationId: string, updateData: OrganizationUpdateRequest): Promise<OrganizationResponse> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    const validationResult = OrganizationUpdateRequestSchema.safeParse(updateData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid organization update data', validationResult.error.issues);
    }
    if (Object.keys(validationResult.data).length === 0) {
        throw new ValidationError('At least one field must be provided for update');
    }
    const response = await this.httpClient.request<OrganizationResponse>(
        `${this.basePath}/${organizationId}`,
        {
            method: 'PUT',
            body: validationResult.data,
        }
    );
    return OrganizationResponseSchema.parse(response);
  }

  /**
   * Deletes an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @returns {Promise<void>}
   */
  async delete(organizationId: string): Promise<void> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    await this.httpClient.request<void>(`${this.basePath}/${organizationId}`, { method: 'DELETE' });
  }

  // --- Organization Member Management --- (/organizations/:id/members)

  /**
   * Adds a member to an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {OrganizationMemberCreateRequest} memberData - User ID and role.
   * @returns {Promise<OrganizationMemberResponse>} Details of the added member.
   */
  async addMember(organizationId: string, memberData: OrganizationMemberCreateRequest): Promise<OrganizationMemberResponse> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    const validationResult = OrganizationMemberCreateRequestSchema.safeParse(memberData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid member creation data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<OrganizationMemberResponse>(
        `${this.basePath}/${organizationId}/members`,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return OrganizationMemberResponseSchema.parse(response);
  }

  /**
   * Lists members of an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {OrganizationMemberListParams} [params] - Pagination parameters.
   * @returns {Promise<OrganizationMemberListResponse>} Paginated list of members.
   */
  async listMembers(organizationId: string, params?: OrganizationMemberListParams): Promise<OrganizationMemberListResponse> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    const validationResult = OrganizationMemberListParamsSchema.safeParse(params || {});
     if (!validationResult.success) {
        throw new ValidationError('Invalid list parameters', validationResult.error.issues);
    }
    const queryParams: Record<string, any> = { ...validationResult.data };
     if (queryParams.page !== undefined) {
        queryParams.offset = ((queryParams.page || 1) - 1) * (queryParams.limit || 10); // Default limit 10
        delete queryParams.page;
    }
    const formattedParams = formatQueryParams(queryParams);

    const response = await this.httpClient.request<OrganizationMemberListResponse>(
        `${this.basePath}/${organizationId}/members`,
        {
            method: 'GET',
            queryParams: formattedParams,
        }
    );
    return OrganizationMemberListResponseSchema.parse(response);
  }

  /**
   * Removes a member from an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {string} userId - The UUID of the user to remove.
   * @returns {Promise<void>}
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    if (!userId) throw new ValidationError('User ID is required');
    await this.httpClient.request<void>(`${this.basePath}/${organizationId}/members/${userId}`, { method: 'DELETE' });
  }

  /**
   * Updates the role of a member within an organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {string} userId - The UUID of the user whose role is being updated.
   * @param {OrganizationMemberUpdateRequest} updateData - The new role.
   * @returns {Promise<OrganizationMemberResponse>} The updated member details.
   */
  async updateMemberRole(organizationId: string, userId: string, updateData: OrganizationMemberUpdateRequest): Promise<OrganizationMemberResponse> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    if (!userId) throw new ValidationError('User ID is required');
    const validationResult = OrganizationMemberUpdateRequestSchema.safeParse(updateData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid member update data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<OrganizationMemberResponse>(
        `${this.basePath}/${organizationId}/members/${userId}`,
        {
            method: 'PUT',
            body: validationResult.data,
        }
    );
    return OrganizationMemberResponseSchema.parse(response);
  }

  // --- Balance Wallet Management --- (/organizations/OrganizationBalancesWalletUpgradeable)

  /**
   * Deploys a new OrganizationBalancesWalletUpgradeable contract.
   * @param {DeployBalanceWalletRequest} deployData - Deployment details (network, deployer wallet, org ID).
   * @returns {Promise<DeployBalanceWalletResponse>} Deployment status and identifiers.
   */
  async deployBalanceWallet(deployData: DeployBalanceWalletRequest): Promise<DeployBalanceWalletResponse> {
      const validationResult = DeployBalanceWalletRequestSchema.safeParse(deployData);
      if (!validationResult.success) {
          throw new ValidationError('Invalid balance wallet deployment data', validationResult.error.issues);
      }
      const response = await this.httpClient.request<DeployBalanceWalletResponse>(
          this.balanceWalletPath,
          {
              method: 'POST',
              body: validationResult.data,
          }
      );
      return DeployBalanceWalletResponseSchema.parse(response);
  }

  /**
   * Lists deployed OrganizationBalancesWalletUpgradeable contracts.
   * Can be filtered by organization ID.
   * @param {BalanceWalletListParams} [params] - Filtering and pagination parameters.
   * @returns {Promise<BalanceWalletListResponse>} Paginated list of balance wallets.
   */
  async listBalanceWallets(params?: BalanceWalletListParams): Promise<BalanceWalletListResponse> {
      const validationResult = BalanceWalletListParamsSchema.safeParse(params || {});
      if (!validationResult.success) {
          throw new ValidationError('Invalid list parameters', validationResult.error.issues);
      }
      const queryParams: Record<string, any> = { ...validationResult.data };
      if (queryParams.page !== undefined) {
          queryParams.offset = ((queryParams.page || 1) - 1) * (queryParams.limit || 10);
          delete queryParams.page;
      }
      const formattedParams = formatQueryParams(queryParams);

      const response = await this.httpClient.request<BalanceWalletListResponse>(
          this.balanceWalletPath,
          {
              method: 'GET',
              queryParams: formattedParams,
          }
      );
      return BalanceWalletListResponseSchema.parse(response);
  }

  /**
   * Updates a deployed OrganizationBalancesWalletUpgradeable contract (e.g., allow token, pause).
   * @param {UpdateBalanceWalletRequest} updateData - Update action and parameters.
   * @returns {Promise<UpdateBalanceWalletResponse>} Transaction ID and status of the update operation.
   */
  async updateBalanceWallet(updateData: UpdateBalanceWalletRequest): Promise<UpdateBalanceWalletResponse> {
      const validationResult = UpdateBalanceWalletRequestSchema.safeParse(updateData);
      if (!validationResult.success) {
          throw new ValidationError('Invalid balance wallet update data', validationResult.error.issues);
      }
      const response = await this.httpClient.request<UpdateBalanceWalletResponse>(
          this.balanceWalletPath,
          {
              method: 'PATCH',
              body: validationResult.data,
          }
      );
      return UpdateBalanceWalletResponseSchema.parse(response);
  }
} 