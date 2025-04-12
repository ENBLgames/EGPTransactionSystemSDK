import { z } from 'zod';

// --- Deploy Contract Schemas ---

// SDK Input (camelCase)
const DeployParamsInputSchema = z.object({
    contractType: z.string(), // e.g., "WalletUpgradeable"
    network: z.string(),
    walletId: z.string().uuid(),
    parameters: z.record(z.unknown()).optional(), // Assuming any object is fine
});

// API Request Body (snake_case, transformed)
export const DeployParamsSchema = DeployParamsInputSchema.transform(data => ({
    contract_type: data.contractType,
    network: data.network,
    wallet_id: data.walletId,
    parameters: data.parameters,
}));
export type DeployParams = z.infer<typeof DeployParamsInputSchema>; // Input type remains camelCase

// API Response (snake_case)
const ApiContractDeploymentResponseSchema = z.object({
    id: z.string().uuid(),
    request_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    created_by_user_id: z.string().uuid().nullable().optional(), // Assuming UUID or null
    created_by_api_key_id: z.string().uuid().nullable().optional(), // Assuming UUID or null
    deployer_wallet_id: z.string().uuid(),
    network: z.string(),
    status: z.string(), // e.g., pending, completed, failed
    contract_type: z.string(),
    contract_address: z.string().nullable().optional(),
    transaction_hash: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
    created_at: z.string(), // Handle date parsing in transform
    updated_at: z.string(), // Handle date parsing in transform
});

// SDK Type (camelCase, transformed)
export const ContractDeploymentResponseSchema = ApiContractDeploymentResponseSchema.transform(data => ({
    id: data.id,
    requestId: data.request_id,
    organizationId: data.organization_id,
    createdByUserId: data.created_by_user_id,
    createdByApiKeyId: data.created_by_api_key_id,
    deployerWalletId: data.deployer_wallet_id,
    network: data.network,
    status: data.status,
    contractType: data.contract_type,
    contractAddress: data.contract_address,
    transactionHash: data.transaction_hash,
    errorMessage: data.error_message,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
}));
export type ContractDeploymentResponse = z.infer<typeof ContractDeploymentResponseSchema>;

// --- ABI Schemas ---

// Matches model.ContractABI (Assuming ABI is a JSON string)
export const ImportABISchema = z.object({
    contractAddress: z.string(),
    network: z.string(),
    abi: z.string().refine(val => {
        try { JSON.parse(val); return true; } catch { return false; }
    }, { message: "ABI must be a valid JSON string" }),
});
export type ImportABI = z.infer<typeof ImportABISchema>;

// Output when getting an ABI
export const ContractABISchema = z.object({
    contractAddress: z.string(),
    network: z.string(),
    abi: z.string(), // Assuming stored as string
    // Add other fields if API returns more than just these
});
export type ContractABI = z.infer<typeof ContractABISchema>;

// --- Contract Function Schemas ---

const FunctionInputOutputSchema = z.object({
    name: z.string(),
    type: z.string(),
    // Add indexed, components etc. if needed for complex types
});

// API Response (snake_case) - Updated to match server model
const ApiContractFunctionSchema = z.object({
    id: z.number(),
    contract_abi_id: z.number(),
    function_name: z.string(),
    function_signature: z.string(),
    access_type: z.string(),
    state_mutability: z.string(),
    parameter_json: z.string(),
    return_json: z.string().optional(),
    created_at: z.string(),
});

// SDK Type (camelCase, transformed)
export const ContractFunctionSchema = ApiContractFunctionSchema.transform(data => {
    // Parse parameter_json and return_json if present
    let inputs = [];
    let outputs = [];
    
    try {
        if (data.parameter_json) {
            inputs = JSON.parse(data.parameter_json);
        }
        if (data.return_json) {
            outputs = JSON.parse(data.return_json);
        }
    } catch (error) {
        console.warn("Error parsing function parameters/returns JSON", error);
    }
    
    return {
        id: data.id,
        contractAbiId: data.contract_abi_id,
        name: data.function_name,
        signature: data.function_signature,
        accessType: data.access_type,
        stateMutability: data.state_mutability,
        inputs: inputs,
        outputs: outputs,
        createdAt: new Date(data.created_at)
    };
});
export type ContractFunction = z.infer<typeof ContractFunctionSchema>;

// Response for List Functions
export const ContractFunctionListSchema = z.array(ContractFunctionSchema);

// --- Call/Execute Function Schemas ---

// Response for calling a view/pure function (matches Swagger)
// API Response (snake_case - assuming result is nested)
const ApiCallFunctionResponseSchema = z.object({
    result: z.any(), // Result could be any type (string, number, object, array)
    raw_result: z.string().optional(), // Optional raw JSON string
});

// SDK Type (camelCase)
export const CallFunctionResponseSchema = ApiCallFunctionResponseSchema.transform(data => ({
    result: data.result,
    rawResult: data.raw_result,
}));
export type CallFunctionResponse = z.infer<typeof CallFunctionResponseSchema>;

// Response for executing a state-changing function
// API Response (snake_case)
const ApiExecuteFunctionResponseSchema = z.object({
    transaction_hash: z.string().optional(), // Transaction hash if submitted successfully
    status: z.string().optional(), // Status of the transaction e.g., "pending"
    error: z.string().optional(), // Error message if transaction failed
});

// SDK Type (camelCase)
export const ExecuteFunctionResponseSchema = ApiExecuteFunctionResponseSchema.transform(data => ({
    transactionHash: data.transaction_hash,
    status: data.status,
    error: data.error,
}));
export type ExecuteFunctionResponse = z.infer<typeof ExecuteFunctionResponseSchema>;

// POST /deployments
// Request: DeployParamsSchema
// Response: ContractDeploymentResponseSchema (Status 202)

// GET /deployments
// Response: z.array(ContractDeploymentResponseSchema)

// GET /deployments/:requestID
// Response: ContractDeploymentResponseSchema

// POST /abis
// Response: ContractABISchema

// GET /abis/:contractAddress
// Query Params: network (string, required)
// Response: ContractABISchema

// GET /abis/:contractAddress/functions
// Query Params: network (string, required)
// Headers: X-Organization-ID, X-Wallet-ID or X-Wallet-Address
// Response: z.array(ContractFunctionSchema) 