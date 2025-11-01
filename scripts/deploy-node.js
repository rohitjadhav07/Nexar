// Node.js deployment script for Stellar contracts
// This bypasses the SSL certificate issues with stellar CLI

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StellarAgentPay Testnet Deployment (Node.js)');
console.log('='.repeat(50));
console.log('');

// Check if WASM files exist
const paymentWasm = path.join(__dirname, '../target/wasm32-unknown-unknown/release/stellar_agent_pay.wasm');
const routerWasm = path.join(__dirname, '../target/wasm32-unknown-unknown/release/multi_asset_router.wasm');

if (!fs.existsSync(paymentWasm)) {
  console.error('❌ Payment contract WASM not found!');
  console.log('Run: cargo build --release --target wasm32-unknown-unknown');
  process.exit(1);
}

if (!fs.existsSync(routerWasm)) {
  console.error('❌ Router contract WASM not found!');
  console.log('Run: cargo build --release --target wasm32-unknown-unknown');
  process.exit(1);
}

console.log('✅ WASM files found');
console.log('');

// Get admin address
let adminAddress;
try {
  adminAddress = execSync('stellar keys address admin', { encoding: 'utf-8' }).trim();
  console.log(`👤 Admin Address: ${adminAddress}`);
} catch (error) {
  console.error('❌ Admin account not found');
  console.log('Run: stellar keys generate admin --network testnet --fund');
  process.exit(1);
}

console.log('');
console.log('📝 Note: Due to SSL certificate issues on Windows, you may need to:');
console.log('1. Use WSL (Windows Subsystem for Linux)');
console.log('2. Use Docker with Stellar CLI');
console.log('3. Deploy via Stellar Laboratory web interface');
console.log('');
console.log('For now, here are your deployment commands:');
console.log('');
console.log('='.repeat(50));
console.log('DEPLOYMENT COMMANDS (run these manually if needed):');
console.log('='.repeat(50));
console.log('');
console.log('# Deploy Payment Contract:');
console.log(`stellar contract deploy --wasm ${paymentWasm} --source admin --network testnet`);
console.log('');
console.log('# Deploy Router Contract:');
console.log(`stellar contract deploy --wasm ${routerWasm} --source admin --network testnet`);
console.log('');
console.log('='.repeat(50));
console.log('');
console.log('💡 Alternative: Use Stellar Laboratory');
console.log('https://laboratory.stellar.org/#?network=testnet');
console.log('');
console.log('Steps:');
console.log('1. Go to "Build Transaction"');
console.log('2. Source Account:', adminAddress);
console.log('3. Operation: "Invoke Host Function"');
console.log('4. Function: "Upload Contract WASM"');
console.log('5. Upload the WASM file');
console.log('6. Sign with your admin secret key');
console.log('');
console.log('Get admin secret: stellar keys show admin');
console.log('');
