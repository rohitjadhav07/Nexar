#!/bin/bash

# StellarAgentPay Testnet Deployment Script
# This script deploys both contracts to Stellar testnet

set -e

echo "🚀 StellarAgentPay Testnet Deployment"
echo "======================================"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Please install it first."
    exit 1
fi

# Check if ADMIN_SECRET_KEY is set
if [ -z "$ADMIN_SECRET_KEY" ]; then
    echo "⚠️  ADMIN_SECRET_KEY not set. Generating a new keypair..."
    ADMIN_SECRET_KEY=$(stellar keys generate admin --network testnet --fund)
    echo "✅ Generated and funded admin account"
    echo "💾 Save this secret key: $ADMIN_SECRET_KEY"
fi

# Get admin public key
ADMIN_PUBLIC_KEY=$(stellar keys address admin)
echo "👤 Admin Public Key: $ADMIN_PUBLIC_KEY"

# Build contracts
echo ""
echo "📦 Building smart contracts..."
cargo build --release --target wasm32-unknown-unknown

# Check if build was successful
if [ ! -f "target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm" ]; then
    echo "❌ Payment contract build failed"
    exit 1
fi

if [ ! -f "target/wasm32-unknown-unknown/release/multi_asset_router.wasm" ]; then
    echo "❌ Router contract build failed"
    exit 1
fi

echo "✅ Contracts built successfully"

# Deploy Payment Contract
echo ""
echo "🔗 Deploying StellarAgentPay contract..."
PAYMENT_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm \
    --source admin \
    --network testnet)

echo "✅ Payment Contract deployed: $PAYMENT_CONTRACT_ID"

# Deploy Multi-Asset Router
echo ""
echo "💱 Deploying Multi-Asset Router..."
ROUTER_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/multi_asset_router.wasm \
    --source admin \
    --network testnet)

echo "✅ Router Contract deployed: $ROUTER_CONTRACT_ID"

# Initialize Payment Contract
echo ""
echo "⚙️  Initializing Payment Contract..."
stellar contract invoke \
    --id $PAYMENT_CONTRACT_ID \
    --source admin \
    --network testnet \
    -- \
    __constructor \
    --admin $ADMIN_PUBLIC_KEY

echo "✅ Payment Contract initialized"

# Initialize Router Contract
echo ""
echo "⚙️  Initializing Router Contract..."
stellar contract invoke \
    --id $ROUTER_CONTRACT_ID \
    --source admin \
    --network testnet \
    -- \
    __constructor \
    --admin $ADMIN_PUBLIC_KEY

echo "✅ Router Contract initialized"

# Save contract addresses to .env file
echo ""
echo "💾 Saving contract addresses..."
cat > .env.contracts << EOF
# Stellar Testnet Contract Addresses
# Generated on $(date)

STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
PAYMENT_CONTRACT_ID=$PAYMENT_CONTRACT_ID
ROUTER_CONTRACT_ID=$ROUTER_CONTRACT_ID
ADMIN_PUBLIC_KEY=$ADMIN_PUBLIC_KEY
EOF

echo "✅ Contract addresses saved to .env.contracts"

# Display summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "Payment Contract: $PAYMENT_CONTRACT_ID"
echo "Router Contract:  $ROUTER_CONTRACT_ID"
echo "Admin Address:    $ADMIN_PUBLIC_KEY"
echo ""
echo "📋 Next steps:"
echo "1. Copy contract addresses to ai-agent/.env"
echo "2. Copy contract addresses to frontend/.env"
echo "3. Test contract functions"
echo ""
echo "🔗 View on Stellar Expert:"
echo "https://stellar.expert/explorer/testnet/contract/$PAYMENT_CONTRACT_ID"
echo "https://stellar.expert/explorer/testnet/contract/$ROUTER_CONTRACT_ID"
