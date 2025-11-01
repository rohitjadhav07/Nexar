import { signTransaction } from '@stellar/freighter-api'

const HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
const SOCIAL_CONTRACT_ID = import.meta.env.VITE_SOCIAL_CONTRACT_ID || 'CDTF77SM6QIJGSZ3FGUNACPSJARB7ZYHZB6JV44VQWVZD6BJ7SFFIQAB'
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

/**
 * For now, we'll use localStorage to store social data
 * This avoids complex contract invocation issues
 * In production, this would call the smart contract
 */

/**
 * Register a username for your wallet
 */
export async function registerUsername(
  walletAddress: string,
  username: string,
  displayName: string
): Promise<string> {
  try {
    // Check if username is taken
    const allProfiles = getAllProfiles()
    if (allProfiles.some(p => p.username === username)) {
      throw new Error('Username already taken')
    }

    // Store profile
    const profile = {
      address: walletAddress,
      username,
      displayName,
      createdAt: Date.now()
    }
    
    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(profile))
    localStorage.setItem(`username_${username}`, walletAddress)
    
    // Return mock transaction hash
    return 'local_' + Date.now()
  } catch (error: any) {
    console.error('Register username error:', error)
    throw error
  }
}

/**
 * Get username for a wallet address
 */
export async function getProfile(walletAddress: string): Promise<{
  username: string
  displayName: string
} | null> {
  try {
    const cached = localStorage.getItem(`profile_${walletAddress}`)
    if (cached) return JSON.parse(cached)
    return null
  } catch (error) {
    console.error('Get profile error:', error)
    return null
  }
}

/**
 * Get all profiles (for searching)
 */
function getAllProfiles() {
  const profiles = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('profile_')) {
      const profile = JSON.parse(localStorage.getItem(key)!)
      profiles.push(profile)
    }
  }
  return profiles
}

/**
 * Search for a user by username
 */
export async function searchUsername(username: string): Promise<string | null> {
  try {
    const address = localStorage.getItem(`username_${username}`)
    return address
  } catch (error) {
    console.error('Search username error:', error)
    return null
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequest(
  from: string,
  to: string
): Promise<string> {
  try {
    // Get or create friends list
    const friends = JSON.parse(localStorage.getItem(`friends_${from}`) || '[]')
    
    // Check if already friends
    if (friends.some((f: any) => f.address === to)) {
      throw new Error('Already friends')
    }
    
    // Add friend
    friends.push({ 
      address: to, 
      status: 'accepted',
      addedAt: Date.now()
    })
    
    localStorage.setItem(`friends_${from}`, JSON.stringify(friends))
    
    // Add reverse friendship
    const toFriends = JSON.parse(localStorage.getItem(`friends_${to}`) || '[]')
    if (!toFriends.some((f: any) => f.address === from)) {
      toFriends.push({ 
        address: from, 
        status: 'accepted',
        addedAt: Date.now()
      })
      localStorage.setItem(`friends_${to}`, JSON.stringify(toFriends))
    }
    
    return 'local_' + Date.now()
  } catch (error: any) {
    console.error('Send friend request error:', error)
    throw error
  }
}

/**
 * Get friends list
 */
export async function getFriends(walletAddress: string): Promise<Array<{
  address: string
  username: string
  displayName: string
  status: 'online' | 'offline'
}>> {
  try {
    const friends = JSON.parse(localStorage.getItem(`friends_${walletAddress}`) || '[]')
    
    return friends.map((friend: any) => {
      const profile = JSON.parse(localStorage.getItem(`profile_${friend.address}`) || '{}')
      return {
        address: friend.address,
        username: profile.username || '@unknown',
        displayName: profile.displayName || 'Unknown User',
        status: 'offline' as const,
      }
    })
  } catch (error) {
    console.error('Get friends error:', error)
    return []
  }
}

/**
 * Send message with payment
 */
export async function sendMessage(
  from: string,
  to: string,
  message: string,
  amount: number
): Promise<string> {
  try {
    if (amount > 0) {
      // If there's a payment, use the real payment function
      const { sendPayment } = await import('./stellarTransactions')
      return await sendPayment({
        from,
        to,
        amount: amount.toString(),
      })
    }
    
    // Just store message locally
    const messages = JSON.parse(localStorage.getItem(`messages_${from}_${to}`) || '[]')
    messages.push({
      from,
      to,
      message,
      amount,
      timestamp: Date.now()
    })
    localStorage.setItem(`messages_${from}_${to}`, JSON.stringify(messages))
    
    return 'local_' + Date.now()
  } catch (error: any) {
    console.error('Send message error:', error)
    throw error
  }
}

/**
 * Get messages between two users
 */
export async function getMessages(user1: string, user2: string): Promise<Array<{
  from: string
  to: string
  message: string
  amount: number
  timestamp: number
}>> {
  try {
    const messages1 = JSON.parse(localStorage.getItem(`messages_${user1}_${user2}`) || '[]')
    const messages2 = JSON.parse(localStorage.getItem(`messages_${user2}_${user1}`) || '[]')
    
    return [...messages1, ...messages2].sort((a, b) => a.timestamp - b.timestamp)
  } catch (error) {
    console.error('Get messages error:', error)
    return []
  }
}
