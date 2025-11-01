# Script to switch to real Stellar SDK implementation

Write-Host "🔄 Switching to REAL Stellar SDK implementation..." -ForegroundColor Cyan

# Backup original files
Write-Host "📦 Backing up mock implementations..." -ForegroundColor Yellow
Copy-Item "ai-agent/src/stellarClient.ts" "ai-agent/src/stellarClient.mock.ts" -Force
Copy-Item "frontend/src/contexts/WalletContext.tsx" "frontend/src/contexts/WalletContext.mock.tsx" -Force

# Replace with real implementations
Write-Host "✅ Installing real implementations..." -ForegroundColor Green
Copy-Item "ai-agent/src/stellarClient.real.ts" "ai-agent/src/stellarClient.ts" -Force
Copy-Item "frontend/src/contexts/WalletContext.real.tsx" "frontend/src/contexts/WalletContext.tsx" -Force

Write-Host ""
Write-Host "✅ Successfully switched to REAL Stellar SDK!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy contracts: .\scripts\deploy-testnet.ps1"
Write-Host "2. Update .env files with contract addresses"
Write-Host "3. Add your OpenAI API key to ai-agent/.env"
Write-Host "4. Start the app: npm run dev"
Write-Host ""
Write-Host "💡 To revert to mock: .\scripts\use-mock-stellar.ps1" -ForegroundColor Cyan
