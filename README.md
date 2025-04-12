# EGP Transactions Service TypeScript SDK

This SDK provides a simple way to interact with the EGP Transactions Service, a comprehensive blockchain transaction management platform for enterprise environments.

## What is EGP Transactions Service?

EGP Transactions Service helps organizations manage blockchain transactions with enterprise-grade security and control. It offers:

- **Multi-blockchain support** - Works with Polygon, Ethereum, and other EVM-compatible chains
- **Smart contract management** - Import ABIs, call functions, and deploy contracts
- **Wallet management** - Create and manage blockchain wallets securely
- **Transaction controls** - Approval workflows, spending limits, and governance features
- **Enterprise security** - Role-based access control and secure key management

## SDK Structure

```
docs/sdks/typeScript/
├── src/
│   ├── core/               # Core functionality
│   │   ├── errors.ts       # Custom error types
│   │   └── httpClient.ts   # API communication
│   ├── resources/          # API resources
│   │   ├── apiKeys.ts      # API key management
│   │   ├── auth.ts         # Authentication
│   │   ├── contracts.ts    # Smart contract interactions
│   │   ├── organizations.ts # Organization management
│   │   ├── permissions.ts  # Permission control
│   │   ├── transactions.ts # Transaction operations
│   │   └── wallets.ts      # Wallet management
│   ├── types/              # TypeScript and Zod schemas
│   │   ├── apiKey.types.ts # API key types
│   │   ├── auth.types.ts   # Authentication types
│   │   ├── common.ts       # Shared types
│   │   ├── contract.types.ts # Contract types
│   │   ├── organization.types.ts # Organization types
│   │   ├── permission.types.ts # Permission types
│   │   ├── transaction.types.ts # Transaction types
│   │   └── wallet.types.ts # Wallet types
│   └── index.ts            # Main entry point
├── tests/                  # Test suite
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## Installation

```bash
# Using npm
npm install egp-transactions-sdk

# Using Yarn
yarn add egp-transactions-sdk

# Using Bun
bun add egp-transactions-sdk
```

## Quick Start

```typescript
import { TransactionsSDK } from 'egp-transactions-sdk';

// Initialize the SDK
const sdk = new TransactionsSDK({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key', // Or use JWT authentication
});

// Example: Create a wallet
const newWallet = await sdk.wallets.create({
  name: "My Ethereum Wallet",
  blockchain: "ethereum",
  metadata: {
    description: "Main treasury wallet"
  }
});

// Example: Call a contract function
const result = await sdk.contracts.callViewFunctionByName(
  "0x1234567890abcdef1234567890abcdef12345678", // Contract address
  "polygon", // Network
  "getActiveUserCount" // Function name
);
```

## Key Features

### Authentication
- API key or JWT authentication
- Multi-factor authentication support
- Organization context management

### Wallet Management
- Create and access blockchain wallets
- Add metadata for organization
- Track balances and transaction history

### Transaction Operations
- Create, track, and approve transactions
- Apply governance rules
- View transaction status and history

### Smart Contract Interactions
- Deploy smart contracts
- Call view functions (read-only)
- Execute state-changing functions
- Manage contract ABIs

### Organization Management
- Create and manage organizations
- Add members and assign roles
- Set permissions and transaction limits

## Building from Source

```bash
# Clone the repository (yes Yev, it will have another repo lol)
git clone https://github.com/your-org/egp-transactions-sdk.git
cd egp-transactions-sdk

# Install dependencies
bun install

# Build the SDK
bun run build

# Run tests
bun test
```

## Quick Examples

### Authentication

```typescript
// Register a new user
const newUser = await sdk.auth.register({
  email: "user@example.com",
  password: "securePassword123!",
  firstName: "Jane",
  lastName: "Doe"
});
// Returns user object with ID and verification status

// Login and get access token
const authResponse = await sdk.auth.login({
  email: "user@example.com",
  password: "securePassword123!"
});
// Returns { user, accessToken, refreshToken }

// Use token with SDK
const authenticatedSDK = new TransactionsSDK({
  baseUrl: "https://api.example.com",
  jwtToken: authResponse.accessToken
});
```

### Organization Management

```typescript
// Create a new organization
const organization = await sdk.organizations.create({
  name: "Acme Corporation",
  description: "Blockchain innovation division",
  metadata: { industry: "Manufacturing" }
});
// Returns organization object with ID

// Set organization context for subsequent operations
sdk.setOrganizationId(organization.id);
```

### API Keys

```typescript
// Create an API key for programmatic access
const apiKey = await sdk.apiKeys.create({
  name: "Backend Integration Key",
  permissions: ["wallets:read", "wallets:write", "transactions:create"],
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
});
// Returns { id, key (only shown once!), name, permissions }

// Use API key with SDK
const apiKeySDK = new TransactionsSDK({
  baseUrl: "https://api.example.com",
  apiKey: apiKey.key,
  organizationId: organization.id
});
```

### Wallet Management

```typescript
// Create a new blockchain wallet
const wallet = await sdk.wallets.create({
  name: "Treasury Wallet",
  blockchain: "ethereum", // or "polygon", etc.
  metadata: { purpose: "Company treasury" }
});
// Returns wallet object with ID and blockchain address

// Get wallet balance
const balance = await sdk.wallets.getBalance(wallet.id);
// Returns balance in native token and any other tokens
```

Enjoy!