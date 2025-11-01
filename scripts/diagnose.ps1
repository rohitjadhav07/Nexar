# Diagnostic Script - Find the Issue

Write-Host "Running diagnostics..." -ForegroundColor Cyan
Write-Host ""

$issues = 0

# Check 1: Node modules
Write-Host "1. Checking node_modules..." -ForegroundColor Yellow
Set-Location frontend
if (Test-Path "node_modules") {
    Write-Host "   OK - node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - node_modules missing!" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
    $issues++
}

# Check 2: Required files
Write-Host ""
Write-Host "2. Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "src/App.tsx",
    "src/main.tsx",
    "src/contexts/WalletContext.tsx",
    "src/components/Layout.tsx",
    "src/pages/Dashboard.tsx"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   OK - $file" -ForegroundColor Green
    } else {
        Write-Host "   ERROR - $file missing!" -ForegroundColor Red
        $issues++
    }
}

# Check 3: Which wallet implementation
Write-Host ""
Write-Host "3. Checking wallet implementation..." -ForegroundColor Yellow
$walletContext = Get-Content "src/contexts/WalletContext.tsx" -Raw
if ($walletContext -match "freighter-api") {
    Write-Host "   Using: Real Freighter" -ForegroundColor Cyan
    Write-Host "   Note: Requires Freighter extension installed" -ForegroundColor Yellow
} elseif ($walletContext -match "mockWallet") {
    Write-Host "   Using: Mock Wallet" -ForegroundColor Green
    Write-Host "   Note: No wallet needed, works immediately" -ForegroundColor Green
} else {
    Write-Host "   Unknown wallet implementation" -ForegroundColor Yellow
}

# Check 4: Package.json
Write-Host ""
Write-Host "4. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "   OK - package.json exists" -ForegroundColor Green
    Write-Host "   Name: $($pkg.name)" -ForegroundColor Cyan
    Write-Host "   Version: $($pkg.version)" -ForegroundColor Cyan
} else {
    Write-Host "   ERROR - package.json missing!" -ForegroundColor Red
    $issues++
}

# Check 5: Vite config
Write-Host ""
Write-Host "5. Checking vite.config.ts..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    Write-Host "   OK - vite.config.ts exists" -ForegroundColor Green
} else {
    Write-Host "   ERROR - vite.config.ts missing!" -ForegroundColor Red
    $issues++
}

Set-Location ..

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($issues -eq 0) {
    Write-Host "SUCCESS - No issues found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Try these steps:" -ForegroundColor Yellow
    Write-Host "1. cd frontend"
    Write-Host "2. Remove-Item .vite -Recurse -Force -ErrorAction SilentlyContinue"
    Write-Host "3. npm run dev"
    Write-Host "4. Open http://localhost:5173 in INCOGNITO mode"
    Write-Host ""
    Write-Host "If still blank, check browser console (F12)" -ForegroundColor Cyan
} else {
    Write-Host "ISSUES FOUND: $issues" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the errors above, then try again" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
