import { z } from 'zod';

// Enums based on Go consts
export const ApprovalStatusSchema = z.enum([
    'pending',
    'approved',
    'rejected',
    'expired'
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalReasonSchema = z.enum([
    'high_value',
    'daily_limit_exceeded',
    'suspicious_activity',
    'new_recipient'
]).nullable().optional(); // Nullable/optional as it might not always be present
export type ApprovalReason = z.infer<typeof ApprovalReasonSchema>;

// Base Approval Response (matches model.TransactionApprovalResponse)
export const TransactionApprovalResponseSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  status: ApprovalStatusSchema,
  reason: ApprovalReasonSchema,
  requestedBy: z.string().uuid(), // Assuming this is a User ID
  approvedBy: z.string().uuid().optional().nullable(), // Assuming User ID
  requestedAt: z.string().datetime().transform((val) => new Date(val)),
  respondedAt: z.string().datetime().transform((val) => new Date(val)).optional().nullable(),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
  notes: z.string().optional().nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});
export type TransactionApprovalResponse = z.infer<typeof TransactionApprovalResponseSchema>;

// GET /transaction-approvals (List Pending)
export const ApprovalListParamsSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
});
export type ApprovalListParams = z.infer<typeof ApprovalListParamsSchema>;

// Generic Paginated Response structure (can be moved to common.types.ts later)
export const PaginatedApprovalResponseSchema = z.object({
    data: z.array(TransactionApprovalResponseSchema),
    totalCount: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
});
export type PaginatedApprovalResponse = z.infer<typeof PaginatedApprovalResponseSchema>;

// GET /transaction-approvals/:id
// Response: TransactionApprovalResponseSchema

// GET /transaction-approvals/transaction/:transactionId
// Response: z.array(TransactionApprovalResponseSchema)

// POST /transaction-approvals/approve
export const ApproveTransactionRequestSchema = z.object({
    approvalId: z.string().uuid(),
    notes: z.string().optional(),
});
export type ApproveTransactionRequest = z.infer<typeof ApproveTransactionRequestSchema>;
// Response: TransactionApprovalResponseSchema

// POST /transaction-approvals/reject
export const RejectTransactionRequestSchema = z.object({
    approvalId: z.string().uuid(),
    reason: z.string().optional(), // Different from notes in approve?
});
export type RejectTransactionRequest = z.infer<typeof RejectTransactionRequestSchema>;
// Response: TransactionApprovalResponseSchema

// POST /transaction-approvals/request
export const RequestApprovalRequestSchema = z.object({
    transactionId: z.string().uuid(),
    notes: z.string().optional(),
});
export type RequestApprovalRequest = z.infer<typeof RequestApprovalRequestSchema>;
// Response: TransactionApprovalResponseSchema 