import { z } from 'zod';

// Base User Information (matches model.UserResponse)
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(), // Consider z.enum(['superadmin', 'admin', 'manager', 'user']) if roles are fixed
  createdAt: z.string().datetime().transform((val) => new Date(val)).optional(), // Made optional
  updatedAt: z.string().datetime().transform((val) => new Date(val)).optional(), // Made optional
  status: z.string(), // Consider z.enum(['active', 'inactive', 'suspended'])
  emailVerified: z.boolean().optional(), // Made optional
});
export type User = z.infer<typeof UserSchema>;

// POST /register
export const UserRegistrationRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;
// Response: UserSchema

// POST /login
export const UserLoginRequestSchema = z.object({
  // username: z.string().optional(), // Server code uses email binding only
  email: z.string().email(),
  password: z.string(),
  mfaCode: z.string().optional(), // For HandleMFALogin endpoint
});
export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>;

// Input schema matching the API's snake_case response
const ApiTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int(),
  token_type: z.literal('Bearer'),
  user_id: z.string().uuid().optional(),
  mfa_required: z.boolean().optional(),
  expires_at: z.number().int().optional(), // Unix timestamp
  refresh_expires_at: z.number().int().optional(), // Unix timestamp
});

// Output schema with camelCase and transformation
export const TokenResponseSchema = ApiTokenResponseSchema.transform((data) => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  expiresIn: data.expires_in,
  tokenType: data.token_type,
  userId: data.user_id,
  mfaRequired: data.mfa_required,
  expiresAt: data.expires_at,
  refreshExpiresAt: data.refresh_expires_at,
}));

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// POST /refresh
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
// Response: TokenResponseSchema

// POST /change-password (Protected)
export const PasswordChangeRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from the current password",
  path: ["newPassword"], // Attach error to newPassword field
});
export type PasswordChangeRequest = z.infer<typeof PasswordChangeRequestSchema>;

// Generic success message response used by some endpoints
export const MessageResponseSchema = z.object({
    message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
// Response for ChangePassword: MessageResponseSchema

// GET /me (Protected)
// Request: None
// Response: UserSchema

// POST /logout (Protected)
// Request/Response: TBD - Needs handler details. Assume no body/response for now.

// --- MFA Schemas (Placeholders - need model definitions) ---

// POST /mfa/verify
export const MfaVerifyRequestSchema = z.object({
    // Based on UserLoginRequest having mfaCode, maybe just email/password + mfaCode?
    email: z.string().email(),
    password: z.string(),
    mfaCode: z.string(),
});
export type MfaVerifyRequest = z.infer<typeof MfaVerifyRequestSchema>;
// Response: TokenResponseSchema

// POST /mfa/setup (Protected)
export const MfaSetupResponseSchema = z.object({
    secret: z.string(),
    qrCode: z.string(), // Typically base64 encoded PNG or SVG data URL
});
export type MfaSetupResponse = z.infer<typeof MfaSetupResponseSchema>;
// Request: None

// POST /mfa/enable (Protected)
export const MfaEnableRequestSchema = z.object({
    mfaCode: z.string(),
});
export type MfaEnableRequest = z.infer<typeof MfaEnableRequestSchema>;
// Response: MessageResponseSchema

// POST /mfa/disable (Protected)
export const MfaDisableRequestSchema = z.object({
    // Maybe requires password or MFA code for confirmation?
    password: z.string().optional(), // Assumption
    mfaCode: z.string().optional(), // Assumption
});
export type MfaDisableRequest = z.infer<typeof MfaDisableRequestSchema>;
// Response: MessageResponseSchema

// GET /mfa/status (Protected)
export const MfaStatusResponseSchema = z.object({
    isEnabled: z.boolean(),
});
export type MfaStatusResponse = z.infer<typeof MfaStatusResponseSchema>;
// Request: None 