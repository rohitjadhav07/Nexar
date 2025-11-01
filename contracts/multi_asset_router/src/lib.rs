#![no_std]
use admin_sep::{Administratable, Upgradable, AdministratableExtension};
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, Vec,
    token, log
};

#[contract]
pub struct MultiAssetRouter;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapPath {
    pub from_asset: Address,
    pub to_asset: Address,
    pub amount_in: i128,
    pub min_amount_out: i128,
    pub path: Vec<Address>, // Intermediate assets for multi-hop swaps
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SwapResult {
    pub amount_out: i128,
    pub price_impact: i128, // Basis points (100 = 1%)
    pub fees_paid: i128,
}

#[contracttype]
pub enum DataKey {
    SlippageTolerance,
    MaxHops,
    SupportedAssets,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidAsset = 1,
    InsufficientLiquidity = 2,
    SlippageExceeded = 3,
    InvalidPath = 4,
    SwapFailed = 5,
    UnauthorizedAsset = 6,
}

#[contractimpl]
impl Administratable for MultiAssetRouter {}

#[contractimpl]
impl Upgradable for MultiAssetRouter {}

#[contractimpl]
impl MultiAssetRouter {
    pub fn __constructor(env: &Env, admin: Address) {
        Self::set_admin(env, admin);
        // Default 1% slippage tolerance (100 basis points)
        env.storage().instance().set(&DataKey::SlippageTolerance, &100i128);
        // Maximum 3 hops for swap paths
        env.storage().instance().set(&DataKey::MaxHops, &3u32);
    }

    /// Execute a token swap with automatic path finding
    pub fn execute_swap(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount_in: i128,
        min_amount_out: i128,
        payer: Address,
        recipient: Address,
    ) -> Result<SwapResult, Error> {
        payer.require_auth();

        if amount_in <= 0 {
            return Err(Error::InvalidAsset);
        }

        // If same asset, just transfer
        if from_asset == to_asset {
            let token_client = token::Client::new(&env, &from_asset);
            token_client.transfer(&payer, &recipient, &amount_in);
            
            return Ok(SwapResult {
                amount_out: amount_in,
                price_impact: 0,
                fees_paid: 0,
            });
        }

        // Find optimal swap path
        let swap_path = Self::find_optimal_path(&env, from_asset.clone(), to_asset.clone(), amount_in)?;
        
        // Execute the swap
        let result = Self::execute_swap_path(&env, swap_path, payer, recipient)?;
        
        // Check slippage
        if result.amount_out < min_amount_out {
            return Err(Error::SlippageExceeded);
        }

        log!(&env, "Swap executed: {} -> {}, amount: {}", from_asset, to_asset, result.amount_out);
        
        Ok(result)
    }

    /// Find the optimal swap path between two assets
    pub fn find_optimal_path(
        env: &Env,
        from_asset: Address,
        to_asset: Address,
        amount_in: i128,
    ) -> Result<SwapPath, Error> {
        // For now, implement direct swap path
        // In a full implementation, this would query Stellar DEX for liquidity
        // and find the best multi-hop path
        
        let path = Vec::new(&env);
        
        // Simulate price calculation (in real implementation, query Stellar DEX)
        let estimated_out = Self::estimate_swap_output(&env, from_asset.clone(), to_asset.clone(), amount_in)?;
        
        let slippage_tolerance: i128 = env.storage().instance()
            .get(&DataKey::SlippageTolerance)
            .unwrap_or(100);
        
        let min_amount_out = estimated_out * (10000 - slippage_tolerance) / 10000;
        
        Ok(SwapPath {
            from_asset,
            to_asset,
            amount_in,
            min_amount_out,
            path,
        })
    }

    /// Estimate swap output amount
    pub fn estimate_swap_output(
        _env: &Env,
        _from_asset: Address,
        _to_asset: Address,
        amount_in: i128,
    ) -> Result<i128, Error> {
        // Simplified price estimation
        // In real implementation, this would query Stellar DEX orderbook
        
        // Mock exchange rate (1:1 for demo, real implementation would fetch from DEX)
        let exchange_rate = 1000000i128; // 1.0 in 6 decimal places
        let estimated_out = amount_in * exchange_rate / 1000000;
        
        // Simulate 0.3% trading fee
        let fees = estimated_out * 30 / 10000;
        let amount_out = estimated_out - fees;
        
        if amount_out <= 0 {
            return Err(Error::InsufficientLiquidity);
        }
        
        Ok(amount_out)
    }

    /// Execute a swap along a specific path
    fn execute_swap_path(
        env: &Env,
        swap_path: SwapPath,
        payer: Address,
        recipient: Address,
    ) -> Result<SwapResult, Error> {
        let from_token = token::Client::new(&env, &swap_path.from_asset);
        let to_token = token::Client::new(&env, &swap_path.to_asset);
        
        // Transfer input tokens from payer to contract
        let contract_address = env.current_contract_address();
        from_token.transfer(&payer, &contract_address, &swap_path.amount_in);
        
        // In a real implementation, this would interact with Stellar DEX
        // For now, simulate the swap
        let estimated_out = Self::estimate_swap_output(
            &env, 
            swap_path.from_asset.clone(), 
            swap_path.to_asset.clone(), 
            swap_path.amount_in
        )?;
        
        // Simulate fees (0.3%)
        let fees_paid = estimated_out * 30 / 10000;
        let amount_out = estimated_out - fees_paid;
        
        // In real implementation, execute DEX trade here
        // For demo, we'll simulate having the output tokens
        
        // Transfer output tokens to recipient
        to_token.transfer(&contract_address, &recipient, &amount_out);
        
        Ok(SwapResult {
            amount_out,
            price_impact: 30, // 0.3% in basis points
            fees_paid,
        })
    }

    /// Get current slippage tolerance
    pub fn get_slippage_tolerance(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::SlippageTolerance)
            .unwrap_or(100)
    }

    /// Set slippage tolerance (admin only)
    pub fn set_slippage_tolerance(env: Env, tolerance_bps: i128) -> Result<(), Error> {
        Self::require_admin(&env);
        
        if tolerance_bps < 0 || tolerance_bps > 1000 { // Max 10%
            return Err(Error::InvalidAsset);
        }
        
        env.storage().instance().set(&DataKey::SlippageTolerance, &tolerance_bps);
        Ok(())
    }

    /// Add supported asset (admin only)
    pub fn add_supported_asset(env: Env, asset: Address) -> Result<(), Error> {
        Self::require_admin(&env);
        
        let mut supported_assets: Vec<Address> = env.storage().instance()
            .get(&DataKey::SupportedAssets)
            .unwrap_or(Vec::new(&env));
        
        supported_assets.push_back(asset);
        env.storage().instance().set(&DataKey::SupportedAssets, &supported_assets);
        
        Ok(())
    }

    /// Check if asset is supported
    pub fn is_asset_supported(env: Env, asset: Address) -> bool {
        let supported_assets: Vec<Address> = env.storage().instance()
            .get(&DataKey::SupportedAssets)
            .unwrap_or(Vec::new(&env));
        
        for supported_asset in supported_assets.iter() {
            if supported_asset == asset {
                return true;
            }
        }
        
        false
    }

    /// Get quote for a potential swap
    pub fn get_swap_quote(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount_in: i128,
    ) -> Result<SwapResult, Error> {
        let estimated_out = Self::estimate_swap_output(&env, from_asset, to_asset, amount_in)?;
        let fees_paid = estimated_out * 30 / 10000;
        let amount_out = estimated_out - fees_paid;
        
        Ok(SwapResult {
            amount_out,
            price_impact: 30,
            fees_paid,
        })
    }
}