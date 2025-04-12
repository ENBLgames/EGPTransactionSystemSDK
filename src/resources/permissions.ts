import { HttpClient } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import {
    RoleRequestSchema,
    RoleRequest,
    RoleResponseSchema,
    RoleResponse,
    PermissionResponseSchema,
    PermissionResponse,
    AssignRoleRequestSchema,
    AssignRoleRequest,
    AssignPermissionRequestSchema,
    AssignPermissionRequest,
    AssignResourcePermissionRequestSchema,
    AssignResourcePermissionRequest,
    AssignOrgRoleRequestSchema,
    AssignOrgRoleRequest,
    TransactionLimitRequestSchema,
    TransactionLimitRequest,
    TransactionLimitSchema,
    TransactionLimit,
    ResourceTypeSchema,
    ResourceType
} from '../types/permission.types';
import { z } from 'zod';

/**
 * Handles permissions, roles, assignments, and limits.
 * Note: Many endpoints might return 204 No Content on success for write operations.
 *       The specific response types need verification against actual API behavior.
 */
export class PermissionsAPI {
  // Base paths for different resource groups within permissions
  private rolesPath = '/roles';
  private permissionsPath = '/permissions';
  private userRolesPath = '/user-roles';
  private userPermissionsPath = '/user-permissions';
  private resourcePermissionsPath = '/resource-permissions';
  private orgRolesPath = '/organization-roles';
  private limitsPath = '/transaction-limits';

  constructor(private httpClient: HttpClient) {}

  // --- Role Management --- (/roles)

  /**
   * Lists all defined roles.
   * @returns {Promise<RoleResponse[]>} Array of roles.
   */
  async listRoles(): Promise<RoleResponse[]> {
    const response = await this.httpClient.request<RoleResponse[]>(this.rolesPath, { method: 'GET' });
    return z.array(RoleResponseSchema).parse(response);
  }

  /**
   * Creates a new role.
   * @param {RoleRequest} roleData - Role details and permissions to assign.
   * @returns {Promise<RoleResponse>} The created role.
   */
  async createRole(roleData: RoleRequest): Promise<RoleResponse> {
    const validationResult = RoleRequestSchema.safeParse(roleData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid role creation data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<RoleResponse>(
        this.rolesPath,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return RoleResponseSchema.parse(response);
  }

  /**
   * Gets a specific role by its ID.
   * @param {string} roleId - The UUID of the role.
   * @returns {Promise<RoleResponse>} Role details.
   */
  async getRole(roleId: string): Promise<RoleResponse> {
    if (!roleId) throw new ValidationError('Role ID is required');
    const response = await this.httpClient.request<RoleResponse>(`${this.rolesPath}/${roleId}`, { method: 'GET' });
    return RoleResponseSchema.parse(response);
  }

  /**
   * Updates an existing role.
   * @param {string} roleId - The UUID of the role to update.
   * @param {RoleRequest} roleData - Role details and permissions to update.
   * @returns {Promise<RoleResponse>} The updated role.
   */
  async updateRole(roleId: string, roleData: RoleRequest): Promise<RoleResponse> {
    if (!roleId) throw new ValidationError('Role ID is required');
    const validationResult = RoleRequestSchema.safeParse(roleData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid role update data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<RoleResponse>(
        `${this.rolesPath}/${roleId}`,
        {
            method: 'PUT',
            body: validationResult.data,
        }
    );
    return RoleResponseSchema.parse(response);
  }

  /**
   * Deletes a role.
   * @param {string} roleId - The UUID of the role to delete.
   * @returns {Promise<void>}
   */
  async deleteRole(roleId: string): Promise<void> {
    if (!roleId) throw new ValidationError('Role ID is required');
    await this.httpClient.request<void>(`${this.rolesPath}/${roleId}`, { method: 'DELETE' });
  }

  // --- Permission Listing --- (/permissions)

  /**
   * Lists all available permissions.
   * @returns {Promise<PermissionResponse[]>} Array of permissions.
   */
  async listPermissions(): Promise<PermissionResponse[]> {
    const response = await this.httpClient.request<PermissionResponse[]>(this.permissionsPath, { method: 'GET' });
    return z.array(PermissionResponseSchema).parse(response);
  }

  /**
   * Lists permissions available for a specific resource type.
   * @param {ResourceType} resourceType - The type of resource (e.g., 'wallet').
   * @returns {Promise<PermissionResponse[]>} Array of permissions for the type.
   */
  async listPermissionsByResourceType(resourceType: ResourceType): Promise<PermissionResponse[]> {
    const validationResult = ResourceTypeSchema.safeParse(resourceType);
     if (!validationResult.success) {
      throw new ValidationError('Invalid resource type', validationResult.error.issues);
    }
    const response = await this.httpClient.request<PermissionResponse[]>(`${this.permissionsPath}/resource/${resourceType}`, { method: 'GET' });
    return z.array(PermissionResponseSchema).parse(response);
  }

  // --- User Role Assignments --- (/user-roles)

  /**
   * Gets roles assigned to a specific user.
   * @param {string} userId - The UUID of the user.
   * @returns {Promise<RoleResponse[]>} Array of roles assigned to the user.
   */
  async getUserRoles(userId: string): Promise<RoleResponse[]> {
      if (!userId) throw new ValidationError('User ID is required');
      // Assuming response is array of roles based on handler name and common patterns
      const response = await this.httpClient.request<RoleResponse[]>(`${this.userRolesPath}/${userId}`, { method: 'GET' });
      return z.array(RoleResponseSchema).parse(response);
  }

  /**
   * Assigns a role to a user.
   * @param {AssignRoleRequest} assignmentData - User ID and Role ID.
   * @returns {Promise<void>}
   */
  async assignRoleToUser(assignmentData: AssignRoleRequest): Promise<void> {
      const validationResult = AssignRoleRequestSchema.safeParse(assignmentData);
      if (!validationResult.success) {
        throw new ValidationError('Invalid user role assignment data', validationResult.error.issues);
      }
      await this.httpClient.request<void>(
          this.userRolesPath,
          {
              method: 'POST',
              body: validationResult.data,
          }
      );
  }

  /**
   * Revokes a role from a user.
   * @param {string} userId - The UUID of the user.
   * @param {string} roleId - The UUID of the role to revoke.
   * @returns {Promise<void>}
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
      if (!userId) throw new ValidationError('User ID is required');
      if (!roleId) throw new ValidationError('Role ID is required');
      await this.httpClient.request<void>(`${this.userRolesPath}/${userId}/${roleId}`, { method: 'DELETE' });
  }

  // --- User Permission Assignments --- (/user-permissions)

  /**
   * Gets permissions assigned directly to a user (or combined with roles? Check API behavior).
   * @param {string} userId - The UUID of the user.
   * @returns {Promise<PermissionResponse[]>} Array of permissions.
   */
  async getUserPermissions(userId: string): Promise<PermissionResponse[]> {
      if (!userId) throw new ValidationError('User ID is required');
      // Assuming response is array of permissions based on handler name
      const response = await this.httpClient.request<PermissionResponse[]>(`${this.userPermissionsPath}/${userId}`, { method: 'GET' });
      return z.array(PermissionResponseSchema).parse(response);
  }

  /**
   * Assigns a direct permission to a user.
   * @param {AssignPermissionRequest} assignmentData - User ID, Permission ID, and granted status.
   * @returns {Promise<void>}
   */
  async assignPermissionToUser(assignmentData: AssignPermissionRequest): Promise<void> {
      const validationResult = AssignPermissionRequestSchema.safeParse(assignmentData);
      if (!validationResult.success) {
        throw new ValidationError('Invalid user permission assignment data', validationResult.error.issues);
      }
      await this.httpClient.request<void>(
          this.userPermissionsPath,
          {
              method: 'POST',
              body: validationResult.data,
          }
      );
  }

  /**
   * Revokes a direct permission from a user.
   * @param {string} userId - The UUID of the user.
   * @param {string} permissionId - The UUID of the permission to revoke.
   * @returns {Promise<void>}
   */
  async revokePermissionFromUser(userId: string, permissionId: string): Promise<void> {
      if (!userId) throw new ValidationError('User ID is required');
      if (!permissionId) throw new ValidationError('Permission ID is required');
      await this.httpClient.request<void>(`${this.userPermissionsPath}/${userId}/${permissionId}`, { method: 'DELETE' });
  }

  // --- Resource Permission Assignments --- (/resource-permissions)

  /**
   * Assigns a permission for a specific resource to a user.
   * @param {AssignResourcePermissionRequest} assignmentData - User, Resource, Permission details.
   * @returns {Promise<void>}
   */
  async assignPermissionToResource(assignmentData: AssignResourcePermissionRequest): Promise<void> {
      const validationResult = AssignResourcePermissionRequestSchema.safeParse(assignmentData);
      if (!validationResult.success) {
        throw new ValidationError('Invalid resource permission assignment data', validationResult.error.issues);
      }
      await this.httpClient.request<void>(
          this.resourcePermissionsPath,
          {
              method: 'POST',
              body: validationResult.data,
          }
      );
  }

  /**
   * Revokes a specific resource permission from a user.
   * @param {string} userId
   * @param {ResourceType} resourceType
   * @param {string} resourceId
   * @param {string} permissionId
   * @returns {Promise<void>}
   */
  async revokePermissionFromResource(userId: string, resourceType: ResourceType, resourceId: string, permissionId: string): Promise<void> {
      if (!userId) throw new ValidationError('User ID is required');
      if (!resourceType) throw new ValidationError('Resource Type is required');
      if (!resourceId) throw new ValidationError('Resource ID is required');
      if (!permissionId) throw new ValidationError('Permission ID is required');

      // Validate resourceType enum
      const typeValidation = ResourceTypeSchema.safeParse(resourceType);
       if (!typeValidation.success) {
          throw new ValidationError('Invalid resource type');
      }

      await this.httpClient.request<void>(
          `${this.resourcePermissionsPath}/${userId}/${resourceType}/${resourceId}/${permissionId}`,
          { method: 'DELETE' }
      );
  }

  // --- Organization Role Assignments --- (/organization-roles)

  /**
   * Gets roles assigned to a user within a specific organization.
   * @param {string} organizationId - The UUID of the organization.
   * @param {string} userId - The UUID of the user.
   * @returns {Promise<RoleResponse[]>} Array of roles.
   */
  async getOrganizationUserRoles(organizationId: string, userId: string): Promise<RoleResponse[]> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    if (!userId) throw new ValidationError('User ID is required');
    // Assuming response is array of roles
    const response = await this.httpClient.request<RoleResponse[]>(`${this.orgRolesPath}/${organizationId}/${userId}`, { method: 'GET' });
    return z.array(RoleResponseSchema).parse(response);
  }

  /**
   * Assigns a role to a user within an organization.
   * @param {AssignOrgRoleRequest} assignmentData - Org ID, User ID, and Role ID.
   * @returns {Promise<void>}
   */
  async assignRoleToOrganizationUser(assignmentData: AssignOrgRoleRequest): Promise<void> {
    const validationResult = AssignOrgRoleRequestSchema.safeParse(assignmentData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid organization role assignment data', validationResult.error.issues);
    }
    await this.httpClient.request<void>(
        this.orgRolesPath,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
  }

  /**
   * Revokes a role from a user within an organization.
   * @param {string} organizationId
   * @param {string} userId
   * @param {string} roleId
   * @returns {Promise<void>}
   */
  async revokeRoleFromOrganizationUser(organizationId: string, userId: string, roleId: string): Promise<void> {
    if (!organizationId) throw new ValidationError('Organization ID is required');
    if (!userId) throw new ValidationError('User ID is required');
    if (!roleId) throw new ValidationError('Role ID is required');
    await this.httpClient.request<void>(`${this.orgRolesPath}/${organizationId}/${userId}/${roleId}`, { method: 'DELETE' });
  }

  // --- Transaction Limits --- (/transaction-limits)

  /**
   * Sets transaction limits for a specific role.
   * @param {TransactionLimitRequest} limitData - Limit details.
   * @returns {Promise<TransactionLimit>} The created or updated transaction limit.
   */
  async setTransactionLimit(limitData: TransactionLimitRequest): Promise<TransactionLimit> {
    const validationResult = TransactionLimitRequestSchema.safeParse(limitData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid transaction limit data', validationResult.error.issues);
    }
    // Assuming the response returns the set limit details
    const response = await this.httpClient.request<TransactionLimit>(
        this.limitsPath,
        {
            method: 'POST',
            body: validationResult.data,
        }
    );
    return TransactionLimitSchema.parse(response);
  }

  /**
   * Gets transaction limits defined for a specific role.
   * @param {string} roleId - The UUID of the role.
   * @returns {Promise<TransactionLimit[]>} Array of transaction limits.
   */
  async getTransactionLimitsByRole(roleId: string): Promise<TransactionLimit[]> {
    if (!roleId) throw new ValidationError('Role ID is required');
    const response = await this.httpClient.request<TransactionLimit[]>(`${this.limitsPath}/role/${roleId}`, { method: 'GET' });
    return z.array(TransactionLimitSchema).parse(response);
  }
} 