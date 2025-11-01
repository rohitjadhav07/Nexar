# StellarAgentPay Testnet Deployment Script (PowerShell)
# This script deploys both contracts to Stellar testnet

$ErrorActionPreference = "Stop"

Write-Host "🚀 StellarAgentPay Testnet Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if stellar CLI is installed
try {
    $stellarVersion = stellar --version
    Write-Host "✅ Stellar CLI found: $stellarVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Stellar CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Generate or use existing admin keypair
Write-Host ""
Write-Host "👤 Setting up admin account..." -ForegroundColor Yellow

try {
    $adminAddress = stellar keys address admin 2>$null
    Write-Host "✅ Using existing admin account: $adminAddress" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No admin account found. Generating new keypair..." -ForegroundColor Yellow
    stellar keys generate admin --network testnet --fund | Out-Null
    $adminAddress = stellar keys address admin
    Write-Host "✅ Generated and funded admin account: $adminAddress" -ForegroundColor Green
}

# Build contracts
Write-Host ""
Write-Host "📦 Building smart contracts..." -ForegroundColor Yellow
cargo build --release --target wasm32-unknown-unknown

# Check if build was successful
if (-not (Test-Path "target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm")) {
    Write-Host "❌ Payment contract build failed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "target/wasm32-unknown-unknown/release/multi_asset_router.wasm")) {
    Write-Host "❌ Router contract build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contracts built successfully" -ForegroundColor Green

# Deploy Payment Contract
Write-Host ""
Write-Host "🔗 Deploying StellarAgentPay contract..." -ForegroundColor Yellow
$paymentContractId = stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm `
    --source admin `
    --network testnet

Write-Host "✅ Payment Contract deployed: $paymentContractId" -ForegroundColor Green

# Deploy Multi-Asset Router
Write-Host ""
Write-Host "💱 Deploying Multi-Asset Router..." -ForegroundColor Yellow
$routerContractId = stellar contract deploy `
    --wasm target/wasm32-unknown-unknown/release/multi_asset_router.wasm `
    --source admin `
    --network testnet

Write-Host "✅ Router Contract deployed: $routerContractId" -ForegroundColor Green

# Initialize Payment Contract
Write-Host ""
Write-Host "⚙️  Initializing Payment Contract..." -ForegroundColor Yellow
stellar contract invoke `
    --id $paymentContractId `
    --source admin `
    --network testnet `
    -- `
    __constructor `
    --admin $adminAddress

Write-Host "✅ Payment Contract initialized" -ForegroundColor Green

# Initialize Router Contract
Write-Host ""
Write-Host "⚙️  Initializing Router Contract..." -ForegroundColor Yellow
stellar contract invoke `
    --id $routerContractId `
    --source admin `
    --network testnet `
    -- `
    __constructor `
    --admin $adminAddress

Write-Host "✅ Router Contract initialized" -ForegroundColor Green

# Save contract addresses to .env file
Write-Host ""
Write-Host "💾 Saving contract addresses..." -ForegroundColor Yellow

$envContent = @"
# Stellar Testnet Contract Addresses
# Generated on $(Get-Date)

STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
PAYMENT_CONTRACT_ID=$paymentContractId
ROUTER_CONTRACT_ID=$routerContractId
ADMIN_PUBLIC_KEY=$adminAddress
"@

$envContent | Out-File -FilePath ".env.contracts" -Encoding UTF8
Write-Host "✅ Contract addresses saved to .env.contracts" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host "Payment Contract: $paymentContractId" -ForegroundColor Cyan
Write-Host "Router Contract:  $routerContractId" -ForegroundColor Cyan
Write-Host "Admin Address:    $adminAddress" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy contract addresses to ai-agent/.env"
Write-Host "2. Copy contract addresses to frontend/.env"
Write-Host "3. Test contract functions"
Write-Host ""
Write-Host "🔗 View on Stellar Expert:" -ForegroundColor Yellow
Write-Host "https://stellar.expert/explorer/testnet/contract/$paymentContractId"
Write-Host "https://stellar.expert/explorer/testnet/contract/$routerContractId"
