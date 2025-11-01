# Script to switch back to mock implementation (for testing without blockchain)

Write-Host "🔄 Switching to MOCK implementation..." -ForegroundColor Cyan

if (Test-Path "ai-agent/src/stellarClient.mock.ts") {
    Write-Host "✅ Restoring mock implementations..." -ForegroundColor Green
    Copy-Item "ai-agent/src/stellarClient.mock.ts" "ai-agent/src/stellarClient.ts" -Force
    Copy-Item "frontend/src/contexts/WalletContext.mock.tsx" "frontend/src/contexts/WalletContext.tsx" -Force
    
    Write-Host ""
    Write-Host "✅ Successfully switched to MOCK implementation!" -ForegroundColor Green
    Write-Host "💡 This is useful for UI development without blockchain" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No backup files found. Mock files may not exist yet." -ForegroundColor Yellow
}
