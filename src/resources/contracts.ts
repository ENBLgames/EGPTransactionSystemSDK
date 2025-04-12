import { HttpClient } from '../core/httpClient';
import type { RequestOptions } from '../core/httpClient';
import { ValidationError } from '../core/errors';
import {
    DeployParamsSchema,
    ContractDeploymentResponseSchema,
    ImportABISchema,
    ContractABISchema,
    ContractFunctionSchema,
    CallFunctionResponseSchema,
    ExecuteFunctionResponseSchema,
} from '../types/contract.types';
import type {
    DeployParams,
    ContractDeploymentResponse,
    ImportABI,
    ContractABI,
    ContractFunction,
    CallFunctionResponse,
    ExecuteFunctionResponse,
} from '../types/contract.types';
import { z } from 'zod';
import { MessageResponseSchema } from '../types/auth.types';
import type { MessageResponse } from '../types/auth.types';

/**
 * Contracts API
 * 
 * Provides methods for interacting with blockchain smart contracts
 * including deployment, ABI import, function execution and more.
 * 
 * NOTE: When executing contract functions, the backend API expects "wallet_address" 
 * with snake_case in the request payload (not "walletAddress" camelCase or "WalletAddress" PascalCase).
 * This has been handled internally in the executeContractFunctionByName method.
 */
export class ContractsAPI {
  private deploymentsPath = '/contracts/deployments';
  private abisPath = '/contracts/abi';
  private contractInteractionsPath = '/contract-interactions';

  constructor(private httpClient: HttpClient) {}

  // --- Contract Deployments --- (/contracts/deployments)

  /**
   * Initiates a contract deployment.
   * The deployment process is asynchronous.
   * @param {DeployParams} deployData - Details for the deployment.
   * @returns {Promise<ContractDeploymentResponse>} Initial deployment status (usually pending).
   */
  async deploy(deployData: DeployParams): Promise<ContractDeploymentResponse> {
    const validationResult = DeployParamsSchema.safeParse(deployData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid contract deployment data', validationResult.error.issues);
    }
    const response = await this.httpClient.request<ContractDeploymentResponse>(
        '/contracts',
        {
            method: 'POST',
            body: validationResult.data,
            expectedStatus: 202, // API returns 202 Accepted
        }
    );
    return ContractDeploymentResponseSchema.parse(response);
  }

  /**
   * Lists contract deployments for the organization associated with the API key/token.
   * Requires X-Organization-ID header to be set implicitly or explicitly.
   * @returns {Promise<ContractDeploymentResponse[]>} List of deployment details.
   */
  async listDeployments(): Promise<ContractDeploymentResponse[]> {
    // Note: Requires X-Organization-ID header, managed by HttpClient
    const response = await this.httpClient.request<ContractDeploymentResponse[]>(this.deploymentsPath, { method: 'GET' });
    return z.array(ContractDeploymentResponseSchema).parse(response);
  }

  /**
   * Gets the status of a specific contract deployment.
   * @param {string} requestId - The user-facing request ID of the deployment.
   * @returns {Promise<ContractDeploymentResponse>} Deployment status details.
   */
  async getDeploymentStatus(requestId: string): Promise<ContractDeploymentResponse> {
    if (!requestId) throw new ValidationError('Request ID is required');
    // Use the correct path /contracts/{requestId} based on Swagger
    const response = await this.httpClient.request<ContractDeploymentResponse>(`/contracts/${requestId}`, { method: 'GET' });
    return ContractDeploymentResponseSchema.parse(response);
  }

  // --- Contract ABIs --- (/contracts/abi)

  /**
   * Imports a contract ABI.
   * Requires X-Organization-ID header.
   * @param {ImportABI} abiData - Contract address, network, and ABI JSON string.
   * @returns {Promise<MessageResponse>} Success message.
   */
  async importAbi(abiData: ImportABI): Promise<MessageResponse> {
    const validationResult = ImportABISchema.safeParse(abiData);
    if (!validationResult.success) {
      throw new ValidationError('Invalid ABI import data', validationResult.error.issues);
    }
    // Note: Requires X-Organization-ID header, managed by HttpClient
    const response = await this.httpClient.request<MessageResponse>(
        this.abisPath,
        {
            method: 'POST',
            body: validationResult.data,
            expectedStatus: 201
        }
    );
    return MessageResponseSchema.parse(response);
  }

  /**
   * Gets the imported ABI for a contract address and network.
   * Requires X-Organization-ID header.
   * @param {string} contractAddress - The address of the contract.
   * @param {string} network - The network the contract is on.
   * @returns {Promise<ContractABI>} The imported ABI details.
   */
  async getAbi(contractAddress: string, network: string): Promise<ContractABI> {
    if (!contractAddress) throw new ValidationError('Contract Address is required');
    if (!network) throw new ValidationError('Network query parameter is required');
    // Note: Requires X-Organization-ID header, managed by HttpClient
    const response = await this.httpClient.request<ContractABI>(
        `${this.abisPath}/${contractAddress}`,
        {
            method: 'GET',
            queryParams: { network },
        }
    );
    return ContractABISchema.parse(response);
  }

  /**
   * Lists the functions parsed from an imported contract ABI.
   * Requires X-Organization-ID header and EITHER X-Wallet-ID or X-Wallet-Address header for verification.
   * @param {string} contractAddress - The address of the contract.
   * @param {string} network - The network the contract is on.
   * @param {object} verificationHeaders - Headers for verification: { 'X-Wallet-ID': string } or { 'X-Wallet-Address': string }.
   * @returns {Promise<ContractFunction[]>} List of functions from the ABI.
   */
  async listContractFunctions(
      contractAddress: string,
      network: string,
      verificationHeaders: { 'X-Wallet-ID': string } | { 'X-Wallet-Address': string }
  ): Promise<ContractFunction[]> {
    if (!contractAddress) throw new ValidationError('Contract Address is required');
    if (!network) throw new ValidationError('Network query parameter is required');
    
    // Use type narrowing to safely check the union type
    const hasWalletId = 'X-Wallet-ID' in verificationHeaders;
    const hasWalletAddress = 'X-Wallet-Address' in verificationHeaders;

    if (!verificationHeaders || (!hasWalletId && !hasWalletAddress) || (hasWalletId && !verificationHeaders['X-Wallet-ID']) || (hasWalletAddress && !verificationHeaders['X-Wallet-Address'])) {
        throw new ValidationError('A valid X-Wallet-ID or X-Wallet-Address header is required for verification');
    }

    const options: RequestOptions = {
        method: 'GET',
        queryParams: { network },
        headers: verificationHeaders, // Add verification headers
    };

    // Note: Requires X-Organization-ID header, managed by HttpClient
    // Revert path back to using the ABI endpoint
    const response = await this.httpClient.request<ContractFunction[]>(
        `${this.abisPath}/${contractAddress}/functions`, // Reverted path
        options
    );
    return z.array(ContractFunctionSchema).parse(response);
  }

  /**
   * Calls a read-only (view or pure) function on a contract by its name.
   * Does not create a blockchain transaction.
   * Requires JWT or API Key authentication and wallet verification headers.
   * @param contractAddress The address of the contract.
   * @param network The network the contract is on.
   * @param functionName The name of the function to call.
   * @param verificationHeaders Headers for verification: { 'X-Wallet-ID': string } or { 'X-Wallet-Address': string }.
   * @param parameters Optional parameters for the function call (will be JSON stringified).
   * @returns {Promise<CallFunctionResponse>} The result of the function call.
   */
  async callViewFunctionByName(
      contractAddress: string,
      network: string,
      functionName: string,
      verificationHeaders: { 'X-Wallet-ID': string } | { 'X-Wallet-Address': string },
      parameters?: Record<string, any>
  ): Promise<CallFunctionResponse> {
      if (!contractAddress) throw new ValidationError('Contract Address is required');
      if (!network) throw new ValidationError('Network is required');
      if (!functionName) throw new ValidationError('Function Name is required');

      // Validate verification headers (copied from listContractFunctions)
      const hasWalletId = 'X-Wallet-ID' in verificationHeaders;
      const hasWalletAddress = 'X-Wallet-Address' in verificationHeaders;
      if (!verificationHeaders || (!hasWalletId && !hasWalletAddress) || (hasWalletId && !verificationHeaders['X-Wallet-ID']) || (hasWalletAddress && !verificationHeaders['X-Wallet-Address'])) {
          throw new ValidationError('A valid X-Wallet-ID or X-Wallet-Address header is required for verification');
      }

      const queryParams: Record<string, string | undefined> = { network };
      if (parameters && Object.keys(parameters).length > 0) {
          try {
              queryParams.parameters = JSON.stringify(parameters);
          } catch (e) {
              throw new ValidationError('Failed to stringify parameters for query string');
          }
      }

      const options: RequestOptions = {
          method: 'GET',
          queryParams: queryParams,
          headers: verificationHeaders,
      };

      // Use the new contract-interactions path
      const path = `${this.contractInteractionsPath}/contracts/${contractAddress}/call-by-name/${functionName}`;

      console.log(`Calling view function: GET ${path} with params: ${JSON.stringify(queryParams)}`);

      // HttpClient handles the base URL and auth
      const response = await this.httpClient.request<CallFunctionResponse>(
          path,
          options
      );

      // Assuming the API response matches ApiCallFunctionResponseSchema and HttpClient handles unwrapping if necessary
      // The ContractFunctionResponseSchema transformation handles snake_case -> camelCase
      return CallFunctionResponseSchema.parse(response);
  }

  /**
   * Executes a state-changing function on a contract by its name.
   * Creates a blockchain transaction and requires gas.
   * Requires JWT or API Key authentication and wallet verification headers.
   * @param contractAddress The address of the contract.
   * @param network The network the contract is on.
   * @param functionName The name of the function to execute.
   * @param verificationHeaders Headers for verification: { 'X-Wallet-ID': string } or { 'X-Wallet-Address': string }.
   * @param parameters Parameters for the function call as an object (will be included in the request body).
   * @returns {Promise<ExecuteFunctionResponse>} The result of the function execution (transaction hash, status).
   */
  async executeContractFunctionByName(
      contractAddress: string,
      network: string,
      functionName: string,
      verificationHeaders: { 'X-Wallet-ID': string } | { 'X-Wallet-Address': string },
      parameters: Record<string, any>
  ): Promise<ExecuteFunctionResponse> {
      if (!contractAddress) throw new ValidationError('Contract Address is required');
      if (!network) throw new ValidationError('Network is required');
      if (!functionName) throw new ValidationError('Function Name is required');

      // Validate verification headers (similar to callViewFunctionByName)
      const hasWalletId = 'X-Wallet-ID' in verificationHeaders;
      const hasWalletAddress = 'X-Wallet-Address' in verificationHeaders;
      if (!verificationHeaders || (!hasWalletId && !hasWalletAddress) || (hasWalletId && !verificationHeaders['X-Wallet-ID']) || (hasWalletAddress && !verificationHeaders['X-Wallet-Address'])) {
          throw new ValidationError('A valid X-Wallet-ID or X-Wallet-Address header is required for verification');
      }

      // Extract wallet address - use multiple sources in priority order:
      // 1. Parameters.walletAddress
      // 2. X-Wallet-Address header
      // 3. Look up address from wallet ID if needed (not implemented yet)
      let walletAddress = parameters?.walletAddress;
      
      // If not in parameters, try to get from header
      if (!walletAddress && hasWalletAddress) {
          walletAddress = verificationHeaders['X-Wallet-Address'];
      }
      
      if (!walletAddress) {
          throw new ValidationError('WalletAddress is required. Provide it in parameters.walletAddress or use X-Wallet-Address header');
      }

      // Create a new parameters object without walletAddress to avoid duplication
      const paramsCopy = { ...parameters };
      delete paramsCopy.walletAddress;
      
      // For execute functions, create request body in exact format expected by server
      const requestBody = {
          network,
          parameters: paramsCopy,
          // CRITICAL: Server expects wallet_address in snake_case, not WalletAddress
          wallet_address: walletAddress
      };

      const options: RequestOptions = {
          method: 'POST', // Execute functions use POST
          body: requestBody,
          headers: verificationHeaders,
      };

      // Use the contract-interactions path
      const path = `${this.contractInteractionsPath}/contracts/${contractAddress}/execute-by-name/${functionName}`;

      console.log(`Executing contract function: POST ${path} with body:`, JSON.stringify(requestBody));

      // HttpClient handles the base URL, auth, and proper error handling
      const response = await this.httpClient.request<Record<string, any>>(
          path,
          options
      );

      // Return the properly typed response
      return ExecuteFunctionResponseSchema.parse(response);
  }
} 