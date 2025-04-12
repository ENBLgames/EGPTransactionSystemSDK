// Main SDK export
export { TransactionsSDK } from './src/sdk';
export type { TransactionsSDKConfig } from './src/sdk';

// Core exports
export { HttpClient } from './src/core/httpClient';
export type { HttpClientConfig, RequestOptions } from './src/core/httpClient';
export {
    SDKError,
    APIError,
    AuthenticationError,
    ValidationError,
    NetworkError
} from './src/core/errors';

// Type exports (group by resource)
export * as AuthTypes from './src/types/auth.types';
export * as WalletTypes from './src/types/wallet.types';
export * as TransactionTypes from './src/types/transaction.types';
export * as TransactionApprovalTypes from './src/types/transactionApproval.types';
export * as PermissionTypes from './src/types/permission.types';
export * as OrganizationTypes from './src/types/organization.types';
export * as ApiKeyTypes from './src/types/apiKey.types';
export * as ContractTypes from './src/types/contract.types';
// ... other type exports

// Potentially export common types directly if needed
// export * from './src/types/common';

// Log message for development execution
console.log("Transactions SDK module loaded.");