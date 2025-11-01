#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, Address, Env, String, Vec,
};

#[contract]
pub struct SocialPayContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProfile {
    pub address: Address,
    pub username: String,
    pub display_name: String,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Friendship {
    pub user1: Address,
    pub user2: Address,
    pub created_at: u64,
    pub accepted: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Message {
    pub id: u64,
    pub from: Address,
    pub to: Address,
    pub content: String,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Profile(Address),
    Username(String),
    Friendship(Address, Address),
    FriendList(Address),
    MessageCounter,
    Message(u64),
    UserMessages(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    UsernameTaken = 1,
    AlreadyRegistered = 2,
    NotFound = 3,
    Unauthorized = 4,
}

#[contractimpl]
impl SocialPayContract {
    /// Register a username for an address
    pub fn register_username(
        env: Env,
        user: Address,
        username: String,
        display_name: String,
    ) -> Result<bool, Error> {
        user.require_auth();
        
        if env.storage().persistent().has(&DataKey::Username(username.clone())) {
            return Err(Error::UsernameTaken);
        }
        
        if env.storage().persistent().has(&DataKey::Profile(user.clone())) {
            return Err(Error::AlreadyRegistered);
        }
        
        let profile = UserProfile {
            address: user.clone(),
            username: username.clone(),
            display_name,
            created_at: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Profile(user.clone()), &profile);
        env.storage().persistent().set(&DataKey::Username(username), &user);
        
        Ok(true)
    }
    
    /// Get user profile by address
    pub fn get_profile(env: Env, user: Address) -> Option<UserProfile> {
        env.storage().persistent().get(&DataKey::Profile(user))
    }
    
    /// Get address by username
    pub fn get_address_by_username(env: Env, username: String) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Username(username))
    }
    
    /// Send friend request
    pub fn send_friend_request(env: Env, from: Address, to: Address) -> Result<bool, Error> {
        from.require_auth();
        
        let friendship = Friendship {
            user1: from.clone(),
            user2: to.clone(),
            created_at: env.ledger().timestamp(),
            accepted: false,
        };
        
        env.storage().persistent().set(
            &DataKey::Friendship(from, to),
            &friendship
        );
        
        Ok(true)
    }
    
    /// Accept friend request
    pub fn accept_friend_request(env: Env, from: Address, to: Address) -> Result<bool, Error> {
        to.require_auth();
        
        let key = DataKey::Friendship(from.clone(), to.clone());
        let mut friendship: Friendship = env.storage().persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        
        friendship.accepted = true;
        env.storage().persistent().set(&key, &friendship);
        
        let mut from_friends: Vec<Address> = env.storage().persistent()
            .get(&DataKey::FriendList(from.clone()))
            .unwrap_or(Vec::new(&env));
        from_friends.push_back(to.clone());
        env.storage().persistent().set(&DataKey::FriendList(from.clone()), &from_friends);
        
        let mut to_friends: Vec<Address> = env.storage().persistent()
            .get(&DataKey::FriendList(to.clone()))
            .unwrap_or(Vec::new(&env));
        to_friends.push_back(from.clone());
        env.storage().persistent().set(&DataKey::FriendList(to), &to_friends);
        
        Ok(true)
    }
    
    /// Get friend list
    pub fn get_friends(env: Env, user: Address) -> Vec<Address> {
        env.storage().persistent()
            .get(&DataKey::FriendList(user))
            .unwrap_or(Vec::new(&env))
    }
    
    /// Send message with payment
    pub fn send_message(
        env: Env,
        from: Address,
        to: Address,
        content: String,
        amount: i128,
    ) -> Result<u64, Error> {
        from.require_auth();
        
        let counter: u64 = env.storage().instance()
            .get(&DataKey::MessageCounter)
            .unwrap_or(0);
        
        let message_id = counter + 1;
        
        let message = Message {
            id: message_id,
            from: from.clone(),
            to: to.clone(),
            content,
            amount,
            timestamp: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Message(message_id), &message);
        env.storage().instance().set(&DataKey::MessageCounter, &message_id);
        
        let mut user_messages: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserMessages(from.clone()))
            .unwrap_or(Vec::new(&env));
        user_messages.push_back(message_id);
        env.storage().persistent().set(&DataKey::UserMessages(from), &user_messages);
        
        Ok(message_id)
    }
    
    /// Get messages for a user
    pub fn get_user_messages(env: Env, user: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::UserMessages(user))
            .unwrap_or(Vec::new(&env))
    }
    
    /// Get message by ID
    pub fn get_message(env: Env, message_id: u64) -> Option<Message> {
        env.storage().persistent().get(&DataKey::Message(message_id))
    }
}
