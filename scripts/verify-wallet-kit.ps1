# Verify Wallet Kit Installation and Configuration

Write-Host "Verifying Stellar Wallet Kit Setup..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Wallet Kit Package
Write-Host "1. Checking Wallet Kit package..." -ForegroundColor Yellow
Set-Location frontend
$walletKitCheck = npm list @stellar/wallet-sdk 2>&1 | Select-String "@stellar/wallet-sdk"
if ($walletKitCheck) {
    Write-Host "   OK - Wallet Kit installed" -ForegroundColor Green
} else {
    Write-Host "   ERROR - Wallet Kit not installed!" -ForegroundColor Red
    $allGood = $false
}

# Check 2: WalletContext Implementation
Write-Host ""
Write-Host "2. Checking WalletContext implementation..." -ForegroundColor Yellow
$walletContext = Get-Content "src/contexts/WalletContext.tsx" -Raw
if ($walletContext -match "StellarWalletsKit") {
    Write-Host "   OK - WalletContext uses Wallet Kit" -ForegroundColor Green
} else {
    Write-Host "   ERROR - WalletContext not updated!" -ForegroundColor Red
    $allGood = $false
}

# Check 3: Wallet Kit Styles Import
Write-Host ""
Write-Host "3. Checking Wallet Kit styles import..." -ForegroundColor Yellow
$mainTsx = Get-Content "src/main.tsx" -Raw
if ($mainTsx -match "@stellar/wallet-sdk/build/styles.min.css") {
    Write-Host "   OK - Wallet Kit styles imported" -ForegroundColor Green
} else {
    Write-Host "   WARNING - Wallet Kit styles not imported" -ForegroundColor Yellow
}

# Check 4: Node Modules
Write-Host ""
Write-Host "4. Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules/@stellar/wallet-sdk") {
    Write-Host "   OK - Wallet Kit module exists" -ForegroundColor Green
} else {
    Write-Host "   WARNING - Wallet Kit module not found in node_modules" -ForegroundColor Yellow
    Write-Host "   (This is OK if npm install hasn't been run yet)" -ForegroundColor Gray
}

Set-Location ..

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "SUCCESS - All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. cd frontend"
    Write-Host "2. npm run dev"
    Write-Host "3. Open http://localhost:5173"
    Write-Host "4. Click 'Connect Wallet' to see the modal!"
} else {
    Write-Host "ISSUES FOUND - Please fix them first" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fix:" -ForegroundColor Yellow
    Write-Host "cd frontend"
    Write-Host "npm install"
    Write-Host "cd .."
}
Write-Host "========================================" -ForegroundColor Cyan
