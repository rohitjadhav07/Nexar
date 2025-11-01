# Manual deployment script for Windows
# This script helps you deploy contracts when SSL issues occur

Write-Host "=== Stellar Agent Pay - Manual Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if contracts are built
if (-not (Test-Path "target/wasm32-unknown-unknown/release/stellar_agent_pay.optimized.wasm")) {
    Write-Host "Error: Optimized WASM files not found. Run build first:" -ForegroundColor Red
    Write-Host "  cargo build --release --target wasm32-unknown-unknown --package stellar_agent_pay --package multi_asset_router"
    Write-Host "  stellar contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm"
    Write-Host "  stellar contract optimize --wasm target/wasm32-unknown-unknown/release/multi_asset_router.wasm"
    exit 1
}

Write-Host "Contracts found and ready to deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Due to Windows SSL certificate issues, please use one of these methods:" -ForegroundColor Yellow
Write-Host ""
Write-Host "METHOD 1: Stellar Lab (Recommended)" -ForegroundColor Cyan
Write-Host "1. Go to: https://lab.stellar.org/smart-contracts/deploy-contract" -ForegroundColor White
Write-Host "2. Upload: target/wasm32-unknown-unknown/release/stellar_agent_pay.optimized.wasm"
Write-Host "3. Source Account: GCAS34DQBRW6KH8KZKKSCXKYFSIONJSYTZDV7AAQAU2XWGPNSOWJUCIUL"
Write-Host "4. Click 'Build Upload transaction'"
Write-Host "5. Use 'Wallet extension' tab and sign with Freighter"
Write-Host "6. Copy the Contract ID from the result"
Write-Host ""
Write-Host "If you get 'txBadSeq' error:" -ForegroundColor Yellow
Write-Host "  - Wait 5-10 seconds and try again"
Write-Host "  - Or refresh the Stellar Lab page and start over"
Write-Host "  - Make sure no other transactions are pending in Freighter"
Write-Host ""
Write-Host "METHOD 2: Install Contract from WASM Hash" -ForegroundColor Cyan
Write-Host "1. First, upload the WASM to get its hash (doesn't deploy yet)"
Write-Host "2. Then install from that hash"
Write-Host "This is more reliable but requires two steps"
Write-Host ""
Write-Host "After deployment, update these files with your Contract IDs:" -ForegroundColor Green
Write-Host "  - ai-agent/.env"
Write-Host "  - frontend/.env"
Write-Host ""

# Show current contract sizes
$paymentSize = (Get-Item "target/wasm32-unknown-unknown/release/stellar_agent_pay.optimized.wasm").Length
$routerSize = (Get-Item "target/wasm32-unknown-unknown/release/multi_asset_router.optimized.wasm").Length

Write-Host "Contract Sizes:" -ForegroundColor Cyan
Write-Host "  Payment Contract: $([math]::Round($paymentSize/1KB, 2)) KB"
Write-Host "  Router Contract:  $([math]::Round($routerSize/1KB, 2)) KB"
Write-Host ""
Write-Host "Press any key to open Stellar Lab in your browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://lab.stellar.org/smart-contracts/deploy-contract?network=testnet"
