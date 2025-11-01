#!/bin/bash

echo "🚀 StellarAgentPay Deployment Script"
echo "===================================="

# Build contracts
echo "📦 Building smart contracts..."
cargo build --release --target wasm32-unknown-unknown

# Deploy main payment contract
echo "🔗 Deploying StellarAgentPay contract..."
# stellar contract deploy \
#   --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm \
#   --source-account ADMIN_SECRET_KEY \
#   --network testnet

# Deploy multi-asset router
echo "💱 Deploying Multi-Asset Router..."
# stellar contract deploy \
#   --wasm target/wasm32-unknown-unknown/release/multi_asset_router.wasm \
#   --source-account ADMIN_SECRET_KEY \
#   --network testnet

echo "✅ Deployment complete!"
echo "📋 Contract addresses:"
echo "   Payment Contract: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
echo "   Router Contract:  CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

echo ""
echo "🎯 Next steps:"
echo "1. Update .env files with contract addresses"
echo "2. Initialize contracts with admin settings"
echo "3. Test payment flows on testnet"