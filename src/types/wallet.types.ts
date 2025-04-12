import { z } from 'zod';
import { PaginatedResponseSchema } from './pagination.types';
import { TransactionResponseSchema } from './transaction.types'; // Added import
import type { TransactionStatusSchema, TransactionTypeSchema, TransactionResponse } from './transaction.types'; // Assuming transaction types will be in their own file

// Enums based on Go consts
export const WalletStatusSchema = z.enum(['active', 'inactive', 'frozen']);
export type WalletStatus = z.infer<typeof WalletStatusSchema>;

// --- Base Wallet Schemas ---

// API Response (snake_case)
const ApiWalletResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(), // snake_case
  address: z.string(),
  blockchain: z.string(),
  name: z.string(),
  status: WalletStatusSchema,
  metadata: z.record(z.string()).optional().nullable(),
  created_at: z.string(), // snake_case - handle datetime parse in transform
  updated_at: z.string(), // snake_case - handle datetime parse in transform
  organization_id: z.string().uuid().optional().nullable(), // snake_case
});

// SDK Type (camelCase, transformed)
export const WalletSchema = ApiWalletResponseSchema.transform(data => ({
  id: data.id,
  userId: data.user_id,
  address: data.address,
  blockchain: data.blockchain,
  name: data.name,
  status: data.status,
  metadata: data.metadata,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  organizationId: data.organization_id,
}));
export type Wallet = z.infer<typeof WalletSchema>;

// --- Create Wallet Schemas ---

// SDK Input (camelCase)
const WalletCreateRequestInputSchema = z.object({
  blockchain: z.string(),
  name: z.string(),
  userId: z.string().uuid().optional(), // Server defaults to actor if omitted
  organizationId: z.string().uuid(),
  metadata: z.record(z.string()).optional(),
});

// API Request Body (snake_case, transformed)
export const WalletCreateRequestSchema = WalletCreateRequestInputSchema.transform(data => ({
  blockchain: data.blockchain,
  name: data.name,
  user_id: data.userId,
  organization_id: data.organizationId,
  metadata: data.metadata,
}));

export type WalletCreateRequest = z.infer<typeof WalletCreateRequestInputSchema>; // Input type remains camelCase
// Response: WalletSchema

// GET /wallets
export const WalletListParamsSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    // Add other potential filters if needed (e.g., organizationId?)
});
export type WalletListParams = z.infer<typeof WalletListParamsSchema>;

export const WalletListResponseSchema = z.object({
    wallets: z.array(WalletSchema),
    totalCount: z.number().int(),
});
export type WalletListResponse = z.infer<typeof WalletListResponseSchema>;

// GET /wallets/:id
// Response: WalletSchema

// PUT/PATCH /wallets/:id
export const WalletUpdateRequestSchema = z.object({
  name: z.string().optional(),
  status: WalletStatusSchema.optional(),
  metadata: z.record(z.string()).optional(),
});
export type WalletUpdateRequest = z.infer<typeof WalletUpdateRequestSchema>;
// Response: WalletSchema

// DELETE /wallets/:id
// No Request body
// Response: None (204) or MessageResponseSchema

// GET /wallets/:id/balance

// API Response (snake_case)
const ApiWalletBalanceResponseSchema = z.object({
  wallet_id: z.string().uuid(), // snake_case
  address: z.string(),
  blockchain: z.string(),
  balance: z.string(), // Balance as string (e.g., Wei)
  unit: z.string(), // e.g., "ETH", "MATIC"
  updated_at: z.string(), // snake_case - handle datetime parse in transform
});

// SDK Type (camelCase, transformed)
export const WalletBalanceResponseSchema = ApiWalletBalanceResponseSchema.transform(data => ({
  walletId: data.wallet_id,
  address: data.address,
  blockchain: data.blockchain,
  balance: data.balance,
  unit: data.unit,
  updatedAt: new Date(data.updated_at),
}));
export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;

// GET /wallets/:id/transactions
export const WalletTransactionListParamsSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
    // Add filters based on model.TransactionFilterRequest?
    // status: TransactionStatusSchema.optional(),
    // type: TransactionTypeSchema.optional(),
    // fromDate: z.date().optional(), // Need transformation from string?
    // toDate: z.date().optional(),
});
export type WalletTransactionListParams = z.infer<typeof WalletTransactionListParamsSchema>;

export const WalletTransactionListResponseSchema = z.object({
    transactions: z.array(TransactionResponseSchema),
    totalCount: z.number().int(),
});
export type WalletTransactionListResponse = z.infer<typeof WalletTransactionListResponseSchema>;


// POST /wallets/:id/sign
export const SignDataRequestSchema = z.object({
    data: z.instanceof(Uint8Array).optional(), // Base64 string might be easier for JSON
    message: z.string().optional(),
    // Using zod refine to ensure one is present
}).refine(data => data.data || data.message, {
    message: "Either 'data' (Uint8Array) or 'message' (string) must be provided for signing.",
});
export type SignDataRequest = z.infer<typeof SignDataRequestSchema>;

// Alternative using base64 string for data
export const SignDataRequestBase64Schema = z.object({
    data: z.string().optional(), // Expect base64 encoded string
    message: z.string().optional(),
}).refine(data => data.data || data.message, {
    message: "Either 'data' (base64 string) or 'message' (string) must be provided for signing.",
});
export type SignDataRequestBase64 = z.infer<typeof SignDataRequestBase64Schema>;


export const SignDataResponseSchema = z.object({
  signature: z.string(),
  walletId: z.string().uuid(),
});
export type SignDataResponse = z.infer<typeof SignDataResponseSchema>;

// POST /wallets/:id/webhook
// Assuming WebhookEventType is just a string for now
export const WebhookCreateRequestSchema = z.object({
    // resourceType: z.literal("wallet"), // This will be implicit in the WalletsAPI method
    // resourceId: z.string().uuid(), // This will be the path parameter
    eventTypes: z.array(z.string()), // Or z.enum([...]) if types are known and fixed
    url: z.string().url(),
    secret: z.string().optional(),
    active: z.boolean().optional().default(true),
});
export type WebhookCreateRequest = z.infer<typeof WebhookCreateRequestSchema>;

export const WebhookResponseSchema = z.object({
    id: z.string().uuid(),
    resourceType: z.string(),
    resourceId: z.string().uuid(),
    eventTypes: z.array(z.string()),
    url: z.string().url(),
    active: z.boolean(),
    createdAt: z.string().datetime().transform((val) => new Date(val)),
    updatedAt: z.string().datetime().transform((val) => new Date(val)),
});
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;

// GET /wallets/:id/stats
export const WalletStatsResponseSchema = z.object({
    walletId: z.string().uuid(),
    address: z.string(),
    blockchain: z.string(),
    // currentBalance: z.bigint().transform(val => val.toString()), // Zod doesn't support bigint directly in standard JSON parsing
    currentBalance: z.string(), // Assuming server sends as string or number that fits JS number
    transactionCount: z.number().int(),
    lastActivity: z.string().datetime().transform((val) => new Date(val)),
});
export type WalletStatsResponse = z.infer<typeof WalletStatsResponseSchema>; 