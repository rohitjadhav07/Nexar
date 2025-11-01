# Script to switch to Stellar Wallet Kit implementation

Write-Host "🔄 Switching to Stellar Wallet Kit..." -ForegroundColor Cyan
Write-Host ""

# Check if Wallet Kit file exists
if (-not (Test-Path "frontend/src/contexts/WalletContext.walletkit.tsx")) {
    Write-Host "❌ WalletContext.walletkit.tsx not found!" -ForegroundColor Red
    Write-Host "Please make sure the file exists." -ForegroundColor Yellow
    exit 1
}

# Backup current implementation
Write-Host "📦 Backing up current wallet implementation..." -ForegroundColor Yellow
Copy-Item "frontend/src/contexts/WalletContext.tsx" "frontend/src/contexts/WalletContext.backup.tsx" -Force

# Replace with Wallet Kit implementation
Write-Host "✅ Installing Stellar Wallet Kit implementation..." -ForegroundColor Green
Copy-Item "frontend/src/contexts/WalletContext.walletkit.tsx" "frontend/src/contexts/WalletContext.tsx" -Force

Write-Host ""
Write-Host "✅ Successfully switched to Stellar Wallet Kit!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Features enabled:" -ForegroundColor Cyan
Write-Host "  ✅ Freighter wallet support"
Write-Host "  ✅ xBull wallet support"
Write-Host "  ✅ Albedo wallet support"
Write-Host "  ✅ Rabet wallet support"
Write-Host "  ✅ Beautiful wallet selection modal"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure dependencies are installed: cd frontend && npm install"
Write-Host "2. Start the app: npm run dev"
Write-Host "3. Click 'Connect Wallet' to see the wallet selector!"
Write-Host ""
Write-Host "💡 To revert: Copy WalletContext.backup.tsx back to WalletContext.tsx" -ForegroundColor Cyan
