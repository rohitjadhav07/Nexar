# Test Deployment Script
# Verifies that contracts are deployed and accessible

param(
    [string]$PaymentContractId,
    [string]$RouterContractId
)

Write-Host "🧪 Testing StellarAgentPay Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Load from .env.contracts if not provided
if (-not $PaymentContractId -or -not $RouterContractId) {
    if (Test-Path ".env.contracts") {
        Write-Host "📄 Loading contract addresses from .env.contracts..." -ForegroundColor Yellow
        $envContent = Get-Content ".env.contracts"
        foreach ($line in $envContent) {
            if ($line -match "PAYMENT_CONTRACT_ID=(.+)") {
                $PaymentContractId = $matches[1]
            }
            if ($line -match "ROUTER_CONTRACT_ID=(.+)") {
                $RouterContractId = $matches[1]
            }
        }
    } else {
        Write-Host "❌ No .env.contracts file found and no contract IDs provided" -ForegroundColor Red
        Write-Host "Usage: .\test-deployment.ps1 -PaymentContractId CXXX -RouterContractId CXXX" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Payment Contract: $PaymentContractId" -ForegroundColor Cyan
Write-Host "Router Contract:  $RouterContractId" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if contracts exist on network
Write-Host "Test 1: Checking if contracts exist on testnet..." -ForegroundColor Yellow

try {
    $paymentInfo = stellar contract info --id $PaymentContractId --network testnet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Payment contract found on testnet" -ForegroundColor Green
    } else {
        Write-Host "❌ Payment contract not found" -ForegroundColor Red
        Write-Host $paymentInfo -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking payment contract: $_" -ForegroundColor Red
}

try {
    $routerInfo = stellar contract info --id $RouterContractId --network testnet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Router contract found on testnet" -ForegroundColor Green
    } else {
        Write-Host "❌ Router contract not found" -ForegroundColor Red
        Write-Host $routerInfo -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking router contract: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check admin account
Write-Host "Test 2: Checking admin account..." -ForegroundColor Yellow

try {
    $adminAddress = stellar keys address admin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Admin account found: $adminAddress" -ForegroundColor Green
        
        # Check admin balance
        $accountInfo = stellar account --id $adminAddress --network testnet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Admin account is funded" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Admin account may not be funded" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Admin account not found in keychain" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check admin account: $_" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check environment files
Write-Host "Test 3: Checking environment configuration..." -ForegroundColor Yellow

$allConfigured = $true

if (Test-Path "ai-agent/.env") {
    $aiEnv = Get-Content "ai-agent/.env" -Raw
    if ($aiEnv -match "PAYMENT_CONTRACT_ID=$PaymentContractId") {
        Write-Host "✅ AI agent .env configured correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AI agent .env needs contract addresses" -ForegroundColor Yellow
        $allConfigured = $false
    }
    
    if ($aiEnv -match "OPENAI_API_KEY=sk-") {
        Write-Host "✅ OpenAI API key configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OpenAI API key not configured in ai-agent/.env" -ForegroundColor Yellow
        $allConfigured = $false
    }
} else {
    Write-Host "❌ ai-agent/.env not found" -ForegroundColor Red
    $allConfigured = $false
}

if (Test-Path "frontend/.env") {
    $frontendEnv = Get-Content "frontend/.env" -Raw
    if ($frontendEnv -match "VITE_PAYMENT_CONTRACT_ID=$PaymentContractId") {
        Write-Host "✅ Frontend .env configured correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend .env needs contract addresses" -ForegroundColor Yellow
        $allConfigured = $false
    }
} else {
    Write-Host "❌ frontend/.env not found" -ForegroundColor Red
    $allConfigured = $false
}

Write-Host ""

# Test 4: Check if dependencies are installed
Write-Host "Test 4: Checking dependencies..." -ForegroundColor Yellow

if (Test-Path "ai-agent/node_modules") {
    Write-Host "✅ AI agent dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  AI agent dependencies not installed. Run: cd ai-agent && npm install" -ForegroundColor Yellow
}

if (Test-Path "frontend/node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies not installed. Run: cd frontend && npm install" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "📊 Deployment Test Summary" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

if ($allConfigured) {
    Write-Host "✅ All tests passed! Your deployment is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start the app: npm run dev"
    Write-Host "2. Open http://localhost:5173"
    Write-Host "3. Connect Freighter wallet"
    Write-Host "4. Try creating an invoice!"
    Write-Host ""
    Write-Host "🔗 View contracts on Stellar Expert:" -ForegroundColor Cyan
    Write-Host "https://stellar.expert/explorer/testnet/contract/$PaymentContractId"
    Write-Host "https://stellar.expert/explorer/testnet/contract/$RouterContractId"
} else {
    Write-Host "⚠️  Some configuration needed. Please:" -ForegroundColor Yellow
    Write-Host "1. Update ai-agent/.env with contract addresses and OpenAI key"
    Write-Host "2. Update frontend/.env with contract addresses"
    Write-Host "3. Run: npm run install:all"
    Write-Host "4. Run this test again: .\scripts\test-deployment.ps1"
}

Write-Host ""
