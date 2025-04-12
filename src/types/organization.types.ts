import { z } from 'zod';

// --- Organization --- (/organizations)

export const OrgRoleSchema = z.enum(['owner', 'admin', 'member']);
export type OrgRole = z.infer<typeof OrgRoleSchema>;

// Base Organization - Input from API (snake_case)
const ApiOrganizationResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
    owner_id: z.string().uuid(), // Snake case from API
    // email: z.string().email().nullable().optional(), // Not in create response
    // website: z.string().url().nullable().optional(), // Not in create response
    // logoUrl: z.string().url().nullable().optional(), // Not in create response
    // status: z.string(), // Not in create response
    // metadata: z.record(z.unknown()).nullable().optional(), // Not in create response
    created_at: z.string(), // Removed .datetime()
    updated_at: z.string(), // Removed .datetime()
});

// Base Organization - Output Schema (camelCase, transformed)
export const OrganizationResponseSchema = ApiOrganizationResponseSchema.transform(data => ({
    id: data.id,
    name: data.name,
    description: data.description,
    ownerId: data.owner_id,
    createdAt: new Date(data.created_at), // Conversion still happens here
    updatedAt: new Date(data.updated_at), // Conversion still happens here
}));
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;

// POST /organizations
export const OrganizationCreateRequestSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
});
export type OrganizationCreateRequest = z.infer<typeof OrganizationCreateRequestSchema>;
// Response: OrganizationResponseSchema

// GET /organizations (List Response)
export const OrganizationListResponseSchema = z.object({
    totalCount: z.number().int().nonnegative(),
    organizations: z.array(OrganizationResponseSchema),
});
export type OrganizationListResponse = z.infer<typeof OrganizationListResponseSchema>;

// GET /organizations (Query Params)
export const OrganizationListParamsSchema = z.object({
    page: z.number().int().min(1).optional(), // API might use 0-based offset
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
});
export type OrganizationListParams = z.infer<typeof OrganizationListParamsSchema>;

// GET /organizations/:id
// Response: OrganizationResponseSchema

// PUT /organizations/:id
export const OrganizationUpdateRequestSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});
export type OrganizationUpdateRequest = z.infer<typeof OrganizationUpdateRequestSchema>;
// Response: OrganizationResponseSchema

// DELETE /organizations/:id
// Response: None (204) or MessageResponse

// --- Organization Members --- (/organizations/:id/members)

// Base Member (matches model.OrganizationMemberResponse)
export const OrganizationMemberResponseSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    username: z.string(),
    email: z.string().email(),
    role: OrgRoleSchema,
    // joinedAt: z.string().datetime().transform(val => new Date(val)), // Not in response struct
    createdAt: z.string().datetime().transform(val => new Date(val)),
    // updatedAt: z.string().datetime().transform(val => new Date(val)), // Not in response struct
});
export type OrganizationMemberResponse = z.infer<typeof OrganizationMemberResponseSchema>;

// POST /organizations/:id/members
export const OrganizationMemberCreateRequestSchema = z.object({
    userId: z.string().uuid(),
    role: OrgRoleSchema,
});
export type OrganizationMemberCreateRequest = z.infer<typeof OrganizationMemberCreateRequestSchema>;
// Response: OrganizationMemberResponseSchema

// GET /organizations/:id/members (List Response)
export const OrganizationMemberListResponseSchema = z.object({
    totalCount: z.number().int().nonnegative(),
    members: z.array(OrganizationMemberResponseSchema),
});
export type OrganizationMemberListResponse = z.infer<typeof OrganizationMemberListResponseSchema>;

// GET /organizations/:id/members (Query Params)
export const OrganizationMemberListParamsSchema = z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
});
export type OrganizationMemberListParams = z.infer<typeof OrganizationMemberListParamsSchema>;

// DELETE /organizations/:id/members/:userId
// Response: None (204) or MessageResponse

// PUT /organizations/:id/members/:userId
export const OrganizationMemberUpdateRequestSchema = z.object({
    role: OrgRoleSchema,
});
export type OrganizationMemberUpdateRequest = z.infer<typeof OrganizationMemberUpdateRequestSchema>;
// Response: OrganizationMemberResponseSchema

// --- Balance Wallets --- (/organizations/OrganizationBalancesWalletUpgradeable)

export const BalanceWalletActionSchema = z.enum([
    'deploy',
    'allowtokencontract',
    'disabletokencontract',
    'allownativecurrency',
    'disableativecurrency', // Typo in Go model? Assuming disableNativeCurrency
    'pausecontract',
    'unpausecontract'
]);
export type BalanceWalletAction = z.infer<typeof BalanceWalletActionSchema>;

// Base Balance Wallet (matches model.OrganizationBalanceWallet)
export const OrganizationBalanceWalletSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    walletId: z.string().uuid(), // The deployer wallet ID
    contractAddress: z.string(),
    network: z.string(),
    status: z.string(), // e.g., 'active', 'paused'
    errorMessage: z.string().optional().nullable(),
    metadata: z.record(z.unknown()).optional().nullable(), // Represents json.RawMessage
    createdAt: z.string().datetime().transform(val => new Date(val)),
    updatedAt: z.string().datetime().transform(val => new Date(val)),
});
export type OrganizationBalanceWallet = z.infer<typeof OrganizationBalanceWalletSchema>;

// POST /organizations/OrganizationBalancesWalletUpgradeable (Deploy)
export const DeployBalanceWalletRequestSchema = z.object({
    network: z.string(),
    walletId: z.string().uuid(),
    organizationId: z.string().uuid(),
    metadata: z.record(z.unknown()).optional(),
});
export type DeployBalanceWalletRequest = z.infer<typeof DeployBalanceWalletRequestSchema>;

export const DeployBalanceWalletResponseSchema = z.object({
    organizationbalancewalletId: z.string().uuid(),
    organizationbalancewalletPublickey: z.string(), // contractAddress
    status: z.string(),
});
export type DeployBalanceWalletResponse = z.infer<typeof DeployBalanceWalletResponseSchema>;

// GET /organizations/OrganizationBalancesWalletUpgradeable (List Response)
export const BalanceWalletListResponseSchema = z.object({
    totalCount: z.number().int().nonnegative(),
    wallets: z.array(OrganizationBalanceWalletSchema),
});
export type BalanceWalletListResponse = z.infer<typeof BalanceWalletListResponseSchema>;

// GET /organizations/OrganizationBalancesWalletUpgradeable (Query Params)
export const BalanceWalletListParamsSchema = z.object({
    organizationId: z.string().uuid().optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
});
export type BalanceWalletListParams = z.infer<typeof BalanceWalletListParamsSchema>;

// PATCH /organizations/OrganizationBalancesWalletUpgradeable (Update)
export const UpdateBalanceWalletRequestSchema = z.object({
    organizationId: z.string().uuid(),
    walletId: z.string().uuid(), // The *balance* wallet ID (contract ID)
    // userId: z.string().uuid(), // Not needed? Actor taken from context?
    network: z.string(),
    action: BalanceWalletActionSchema,
    tokenAddress: z.string().optional(),
    tokenName: z.string().optional(),
    tokenSymbol: z.string().optional(),
});
export type UpdateBalanceWalletRequest = z.infer<typeof UpdateBalanceWalletRequestSchema>;

export const UpdateBalanceWalletResponseSchema = z.object({
    transactionId: z.string().uuid(),
    status: z.string(),
});
export type UpdateBalanceWalletResponse = z.infer<typeof UpdateBalanceWalletResponseSchema>; 