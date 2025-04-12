import { z } from 'zod';

// Enums based on Go consts
export const ApiKeyStatusSchema = z.enum(['active', 'inactive', 'revoked']);
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusSchema>;

// API Key Response - Input from API (snake_case)
const ApiApiKeyResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    key: z.string().optional(), // Key only present on creation
    permissions: z.array(z.string()),
    status: ApiKeyStatusSchema, // Assuming API returns 'active' or 'inactive'
    expires_at: z.string().nullable().optional(), // snake_case, optional, can be null
    created_at: z.string(), // snake_case
    last_used_at: z.string().nullable().optional(), // snake_case, optional, can be null
    organization_id: z.string().uuid().nullable().optional(), // snake_case, optional, can be null
});

// API Key Response - Output Schema (camelCase, transformed)
export const ApiKeyResponseSchema = ApiApiKeyResponseSchema.transform(data => ({
    id: data.id,
    name: data.name,
    key: data.key,
    permissions: data.permissions,
    status: data.status,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    createdAt: new Date(data.created_at),
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
    organizationId: data.organization_id,
}));
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

// Generic API response wrapper used by the handler
export const ApiKeyApiResponseSchema = z.object({
    success: z.boolean(),
    data: ApiKeyResponseSchema.optional(), // Data is optional, can be array for list
    // error: z.string().optional(), // Error handled by HttpClient
    // message: z.string().optional(),
});
export type ApiKeyApiResponse = z.infer<typeof ApiKeyApiResponseSchema>;

export const ApiKeyListApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(ApiKeyResponseSchema).optional(),
});
export type ApiKeyListApiResponse = z.infer<typeof ApiKeyListApiResponseSchema>;

// POST /api-keys
const ApiKeyCreateRequestInputSchema = z.object({
    name: z.string().min(3).max(100),
    permissions: z.array(z.string()).min(1),
    expiresAt: z.string().datetime({ message: "expiresAt must be a valid ISO 8601 string" }).optional(), // Input uses camelCase
    organizationId: z.string().uuid({ message: "organizationId is required and must be a valid UUID" }), // Input uses camelCase
});

// Transform camelCase input to snake_case for the API request body
export const ApiKeyCreateRequestSchema = ApiKeyCreateRequestInputSchema.transform(data => ({
    name: data.name,
    permissions: data.permissions,
    expires_at: data.expiresAt, // Convert to snake_case
    organization_id: data.organizationId, // Convert to snake_case
}));

export type ApiKeyCreateRequest = z.infer<typeof ApiKeyCreateRequestInputSchema>; // Base type uses camelCase
// Response: ApiKeyResponseSchema (transformed, with key included)

// GET /api-keys
// Response: z.array(ApiKeyResponseSchema) (keys omitted)

// GET /api-keys/:id
// Response: ApiKeyResponseSchema (key omitted)

// PATCH /api-keys/:id
export const ApiKeyUpdateRequestSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    permissions: z.array(z.string()).optional(),
    expiresAt: z.string().datetime({ message: "expiresAt must be a valid ISO 8601 string" }).optional(),
    status: z.enum(['active', 'inactive']).optional(), // Only allow setting active/inactive
}).refine(data => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });
export type ApiKeyUpdateRequest = z.infer<typeof ApiKeyUpdateRequestSchema>;
// Response: ApiKeyResponseSchema (key omitted)

// DELETE /api-keys/:id
// Response: None (204) or generic success response 