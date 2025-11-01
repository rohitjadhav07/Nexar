# Fix Blank Screen Issue

Write-Host "Fixing blank screen issue..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Test with simple App
Write-Host "Step 1: Testing with simple App..." -ForegroundColor Yellow
Set-Location frontend

# Backup current App
if (Test-Path "src/App.tsx") {
    Copy-Item "src/App.tsx" "src/App.backup.tsx" -Force
    Write-Host "   Backed up App.tsx" -ForegroundColor Green
}

# Use simple test App
Copy-Item "src/App.simple.tsx" "src/App.tsx" -Force
Write-Host "   Using simple test App" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Start the dev server now" -ForegroundColor Yellow
Write-Host "Run: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you see 'StellarAgentPay - Test':" -ForegroundColor Green
Write-Host "  - React is working!" -ForegroundColor Green
Write-Host "  - The issue is in components/context" -ForegroundColor Green
Write-Host ""
Write-Host "If still blank:" -ForegroundColor Red
Write-Host "  - Check browser console for errors" -ForegroundColor Red
Write-Host "  - Try different browser" -ForegroundColor Red
Write-Host "  - Clear cache and try again" -ForegroundColor Red
Write-Host ""
Write-Host "To restore original App:" -ForegroundColor Cyan
Write-Host "Copy-Item src/App.backup.tsx src/App.tsx -Force" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location ..
