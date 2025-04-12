import { z } from 'zod';

// Enums based on Go consts
export const ResourceTypeSchema = z.enum([
    'wallet',
    'transaction',
    'batch',
    'user',
    'role',
    'permission',
    'organization_balance_wallet',
    'transaction_approval',
    'contract_deployment'
]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const PermissionActionSchema = z.enum([
    'read',
    'create',
    'update',
    'delete',
    'approve',
    'cancel',
    'process',
    'assign',
    'revoke',
    'list',
    'execute',
    'deploy',
    'administer',
    'use_for_deployment'
]);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

// Base Permission Response (matches model.PermissionResponse)
export const PermissionResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional().nullable(),
    resourceType: ResourceTypeSchema,
    action: PermissionActionSchema,
    isSystem: z.boolean(),
});
export type PermissionResponse = z.infer<typeof PermissionResponseSchema>;

// Base Role Response (matches model.RoleResponse)
export const RoleResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional().nullable(),
    isSystem: z.boolean(),
    createdAt: z.string().datetime().transform(val => new Date(val)),
    updatedAt: z.string().datetime().transform(val => new Date(val)),
    permissions: z.array(PermissionResponseSchema).optional().nullable(), // Permissions included
});
export type RoleResponse = z.infer<typeof RoleResponseSchema>;

// --- Roles --- (/roles)

// GET /roles
// Response: z.array(RoleResponseSchema)

// POST /roles & PUT /roles/:id
export const RoleRequestSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    permissions: z.array(z.string().uuid()).optional(), // Array of Permission IDs
});
export type RoleRequest = z.infer<typeof RoleRequestSchema>;
// Response: RoleResponseSchema

// GET /roles/:id
// Response: RoleResponseSchema

// DELETE /roles/:id
// Response: None (204) or MessageResponse

// --- Permissions --- (/permissions)

// GET /permissions
// Response: z.array(PermissionResponseSchema)

// GET /permissions/resource/:type
// Path Param: type (ResourceTypeSchema)
// Response: z.array(PermissionResponseSchema)

// --- User Roles --- (/user-roles)

// GET /user-roles/:userId
// Response: z.array(RoleResponseSchema) (based on UserRoleResponse structure)

// POST /user-roles
export const AssignRoleRequestSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    // createdBy: z.string().uuid().optional(), // Usually handled server-side
});
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;
// Response: UserRoleSchema? Or just 201/204? Assuming 204 for now.

// DELETE /user-roles/:userId/:roleId
// Response: None (204) or MessageResponse

// --- User Permissions --- (/user-permissions)

// GET /user-permissions/:userId
// Response: z.array(PermissionResponseSchema) (based on UserPermissionResponse structure)

// POST /user-permissions
export const AssignPermissionRequestSchema = z.object({
    userId: z.string().uuid(),
    permissionId: z.string().uuid(),
    granted: z.boolean().optional().default(true),
    // createdBy: z.string().uuid().optional(),
});
export type AssignPermissionRequest = z.infer<typeof AssignPermissionRequestSchema>;
// Response: DirectPermissionSchema? Or just 201/204? Assuming 204.

// DELETE /user-permissions/:userId/:permissionId
// Response: None (204) or MessageResponse

// --- Resource Permissions --- (/resource-permissions)

// POST /resource-permissions
export const AssignResourcePermissionRequestSchema = z.object({
    userId: z.string().uuid(),
    resourceType: ResourceTypeSchema,
    resourceId: z.string(), // Can be UUID or other ID depending on resourceType
    permissionId: z.string().uuid(),
    granted: z.boolean().optional().default(true),
    // createdBy: z.string().uuid().optional(),
});
export type AssignResourcePermissionRequest = z.infer<typeof AssignResourcePermissionRequestSchema>;
// Response: ResourcePermissionSchema? Or just 201/204? Assuming 204.

// DELETE /resource-permissions/:userId/:resourceType/:resourceId/:permissionId
// Response: None (204) or MessageResponse

// --- Organization Roles --- (/organization-roles)

// GET /organization-roles/:organizationId/:userId
// Response: z.array(RoleResponseSchema)? Need confirmation.

// POST /organization-roles
export const AssignOrgRoleRequestSchema = z.object({
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    // createdBy: z.string().uuid().optional(),
});
export type AssignOrgRoleRequest = z.infer<typeof AssignOrgRoleRequestSchema>;
// Response: OrganizationRoleSchema? Or 201/204? Assuming 204.

// DELETE /organization-roles/:organizationId/:userId/:roleId
// Response: None (204) or MessageResponse

// --- Transaction Limits --- (/transaction-limits)

// Base Transaction Limit (matches model.TransactionLimit)
export const TransactionLimitSchema = z.object({
    id: z.string().uuid().optional(),
    roleId: z.string().uuid(),
    blockchain: z.string(),
    maxAmount: z.string(), // String for large numbers
    dailyLimit: z.string(),
    monthlyLimit: z.string(),
    requireApproval: z.boolean(),
    approvalThreshold: z.number().int(), // Assuming int fits JS number range
    createdAt: z.string().datetime().transform(val => new Date(val)).optional(),
    updatedAt: z.string().datetime().transform(val => new Date(val)).optional(),
    createdBy: z.string().uuid().optional().nullable(),
});
export type TransactionLimit = z.infer<typeof TransactionLimitSchema>;

// POST /transaction-limits
export const TransactionLimitRequestSchema = z.object({
    roleId: z.string().uuid(),
    blockchain: z.string(),
    maxAmount: z.string(),
    dailyLimit: z.string(),
    monthlyLimit: z.string(),
    requireApproval: z.boolean().optional().default(false),
    approvalThreshold: z.number().int().optional().default(0),
    // createdBy: z.string().uuid().optional(),
});
export type TransactionLimitRequest = z.infer<typeof TransactionLimitRequestSchema>;
// Response: TransactionLimitSchema?

// GET /transaction-limits/role/:roleId
// Response: z.array(TransactionLimitSchema) 