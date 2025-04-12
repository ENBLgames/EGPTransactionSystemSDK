import { HttpClient, HttpClientConfig } from './core/httpClient';
import { AuthAPI } from './resources/auth';
import { WalletsAPI } from './resources/wallets';
import { TransactionsAPI } from './resources/transactions';
import { TransactionApprovalsAPI } from './resources/transactionApprovals';
import { PermissionsAPI } from './resources/permissions';
import { OrganizationsAPI } from './resources/organizations';
import { ApiKeysAPI } from './resources/apiKeys';
import { ContractsAPI } from './resources/contracts';
// Import other resource APIs here as they are created
// ...

/**
 * Configuration for the Transactions SDK.
 */
export interface TransactionsSDKConfig extends HttpClientConfig {
  // Add any SDK-specific config options here if needed in the future
}

/**
 * Main client for interacting with the Transactions API.
 */
export class TransactionsSDK {
  private httpClient: HttpClient;

  // Resource API properties
  public readonly auth: AuthAPI;
  public readonly wallets: WalletsAPI;
  public readonly transactions: TransactionsAPI;
  public readonly transactionApprovals: TransactionApprovalsAPI;
  public readonly permissions: PermissionsAPI;
  public readonly organizations: OrganizationsAPI;
  public readonly apiKeys: ApiKeysAPI;
  public readonly contracts: ContractsAPI;
  // ... add other resources here

  constructor(config: TransactionsSDKConfig) {
    this.httpClient = new HttpClient(config);

    // Initialize resource APIs, passing the httpClient
    this.auth = new AuthAPI(this.httpClient);
    this.wallets = new WalletsAPI(this.httpClient);
    this.transactions = new TransactionsAPI(this.httpClient);
    this.transactionApprovals = new TransactionApprovalsAPI(this.httpClient);
    this.permissions = new PermissionsAPI(this.httpClient);
    this.organizations = new OrganizationsAPI(this.httpClient);
    this.apiKeys = new ApiKeysAPI(this.httpClient);
    this.contracts = new ContractsAPI(this.httpClient);
    // ... initialize other resources here
  }

  /**
   * Provides direct access to the underlying HttpClient if needed for custom requests.
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }

  // Add any top-level convenience methods if necessary
  // Example:
  // async healthCheck(): Promise<{ status: string; mode: string }> {
  //   // Implementation using this.httpClient.request(...)
  // }
} 