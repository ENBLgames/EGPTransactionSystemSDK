import { z } from 'zod';

// Enums based on Go consts
export const TransactionStatusSchema = z.enum([
    'pending',
    'awaiting_approval',
    'confirmed',
    'failed'
]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionTypeSchema = z.enum([
    'transfer',
    'contract_deploy',
    'contract_call',
    'token_transfer',
    'token_approval',
    'swap'
]).nullable().optional(); // Make optional and nullable based on Go struct
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const FeePrioritySchema = z.enum(['slow', 'medium', 'fast']).nullable().optional();
export type FeePriority = z.infer<typeof FeePrioritySchema>;

// Base Transaction (matches model.TransactionResponse)
export const TransactionResponseSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  txHash: z.string().optional().nullable(),
  blockchain: z.string(),
  status: TransactionStatusSchema,
  type: TransactionTypeSchema,
  amount: z.string(), // Amount as string (e.g., Wei)
  fee: z.string().optional().nullable(), // Fee as string
  recipient: z.string(),
  data: z.string().optional().nullable(),
  metadata: z.record(z.string()).optional().nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

// POST /transactions (Create Transaction)
export const TransactionCreateRequestSchema = z.object({
    walletId: z.string().uuid(),
    recipient: z.string(),
    amount: z.string(),
    type: TransactionTypeSchema,
    data: z.string().optional(),
    metadata: z.record(z.string()).optional(),
    chainId: z.string().optional(), // Often needed for EVM tx signing
    sendMax: z.boolean().optional(),
});
export type TransactionCreateRequest = z.infer<typeof TransactionCreateRequestSchema>;
// Response: TransactionResponseSchema

// GET /transactions (List Transactions Filter/Query Params)
export const TransactionListParamsSchema = z.object({
    walletId: z.string().uuid().optional(),
    blockchain: z.string().optional(),
    status: TransactionStatusSchema.optional(),
    type: TransactionTypeSchema,
    fromDate: z.date().optional(), // Pass as Date object, HttpClient needs to format
    toDate: z.date().optional(),   // Pass as Date object, HttpClient needs to format
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
});
export type TransactionListParams = z.infer<typeof TransactionListParamsSchema>;

// GET /transactions (List Response Body)
export const TransactionListResponseSchema = z.object({
    transactions: z.array(TransactionResponseSchema),
    totalCount: z.number().int(),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;

// GET /transactions/:id or /transactions/hash/:txHash
// Response: TransactionResponseSchema

// GET /transactions/wallet/:walletId
// Params: TransactionListParamsSchema (excluding walletId)
// Response: TransactionListResponseSchema

// GET /transactions/status
export const TransactionStatusQueryParamsSchema = z.object({
    id: z.string().uuid().optional(),
    txHash: z.string().optional(),
}).refine(data => data.id || data.txHash, {
    message: "Either 'id' or 'txHash' must be provided.",
});
export type TransactionStatusQueryParams = z.infer<typeof TransactionStatusQueryParamsSchema>;

export const TransactionStatusResponseSchema = z.object({
    id: z.string().uuid(), // ID is always present in Go struct
    txHash: z.string().optional().nullable(),
    status: TransactionStatusSchema,
    type: TransactionTypeSchema,
    confirmations: z.number().int().nonnegative().optional().nullable(), // Go uses uint64
    blockNumber: z.number().int().nonnegative().optional().nullable(), // Go uses uint64
    error: z.string().optional().nullable(),
});
export type TransactionStatusResponse = z.infer<typeof TransactionStatusResponseSchema>;

// POST /transactions/send
// Mirrors model.SendTransactionRequest more closely now
export const SendTransactionRequestSchema = z.object({
    walletId: z.string().uuid(),
    recipient: z.string(),
    amount: z.string(),
    data: z.string().optional(),
    gasPrice: z.string().optional(),
    gasLimit: z.number().int().positive().optional(), // Go uses uint64
    nonce: z.number().int().nonnegative().optional(),
    priority: FeePrioritySchema,
    type: TransactionTypeSchema,
    metadata: z.record(z.string()).optional(),
    sendMax: z.boolean().optional(),
    // txHash: z.string().optional(), // txHash not typically part of send request body
    // returnRaw: z.boolean().optional(), // Seems like internal flag
});
export type SendTransactionRequest = z.infer<typeof SendTransactionRequestSchema>;
// Response: TransactionResponseSchema

// POST /transactions/commit-send/:id
// Path param: id (string uuid)
// Request Body: None
// Response: TransactionResponseSchema

// POST /transactions/estimate-fee
export const FeeEstimateRequestSchema = z.object({
    walletId: z.string().uuid(),
    recipient: z.string(),
    amount: z.string(),
    type: TransactionTypeSchema,
    data: z.string().optional(),
    blockchain: z.string().optional(), // Likely inferred from walletId
    priority: FeePrioritySchema,
});
export type FeeEstimateRequest = z.infer<typeof FeeEstimateRequestSchema>;

export const FeeEstimateResponseSchema = z.object({
    fee: z.string(),
    currency: z.string(),
    gasPrice: z.string().optional().nullable(),
    gasLimit: z.string().optional().nullable(), // Represent uint64 as string
    estimatedTime: z.string().optional().nullable(),
    priority: FeePrioritySchema,
});
export type FeeEstimateResponse = z.infer<typeof FeeEstimateResponseSchema>;


// POST /transactions/track
export const TrackTransactionRequestSchema = z.object({
    txHash: z.string(),
    blockchain: z.string(),
    walletId: z.string().uuid().optional(),
    metadata: z.record(z.string()).optional(),
});
export type TrackTransactionRequest = z.infer<typeof TrackTransactionRequestSchema>;
// Response: TransactionResponseSchema

// POST /transactions/:id/confirm
// Request/Response TBD 