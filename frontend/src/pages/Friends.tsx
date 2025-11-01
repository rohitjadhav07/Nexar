import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UserPlusIcon, 
  UserGroupIcon, 
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'
import { 
  registerUsername, 
  getProfile, 
  searchUsername, 
  sendFriendRequest, 
  getFriends,
  sendMessage as sendMessageToContract 
} from '../utils/socialContract'

interface Friend {
  address: string
  username: string
  displayName: string
  status: 'online' | 'offline'
}

const Friends: React.FC = () => {
  const { wallet } = useWallet()
  const queryClient = useQueryClient()
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [friendInput, setFriendInput] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{
    from: string
    to: string
    message: string
    amount: number
    timestamp: number
  }>>([])

  // Check if user has registered username
  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile', wallet?.publicKey],
    () => wallet?.publicKey ? getProfile(wallet.publicKey) : null,
    { enabled: !!wallet?.publicKey }
  )

  // Get friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery(
    ['friends', wallet?.publicKey],
    () => wallet?.publicKey ? getFriends(wallet.publicKey) : [],
    { enabled: !!wallet?.publicKey && !!profile }
  )

  // Load chat messages when friend is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (wallet?.publicKey && selectedFriend) {
        const { getMessages } = await import('../utils/socialContract')
        const msgs = await getMessages(wallet.publicKey, selectedFriend.address)
        setChatMessages(msgs)
      }
    }
    loadMessages()
  }, [wallet?.publicKey, selectedFriend])

  // Show registration modal if no profile
  useEffect(() => {
    if (wallet && !profileLoading && !profile) {
      setShowRegister(true)
    }
  }, [wallet, profile, profileLoading])

  // Register username mutation
  const registerMutation = useMutation(
    async () => {
      if (!wallet?.publicKey) throw new Error('Wallet not connected')
      return registerUsername(wallet.publicKey, username, displayName)
    },
    {
      onSuccess: (txHash) => {
        // Cache profile locally
        localStorage.setItem(`profile_${wallet?.publicKey}`, JSON.stringify({
          address: wallet?.publicKey,
          username,
          displayName
        }))
        queryClient.invalidateQueries(['profile'])
        setShowRegister(false)
        alert(`Username registered! Transaction: ${txHash.substring(0, 8)}...`)
      },
      onError: (error: any) => {
        alert(`Failed to register: ${error.message}`)
      }
    }
  )

  // Add friend mutation
  const addFriendMutation = useMutation(
    async () => {
      if (!wallet?.publicKey) throw new Error('Wallet not connected')
      
      // Check if input is username or address
      let friendAddress = friendInput
      if (friendInput.startsWith('@')) {
        const address = await searchUsername(friendInput)
        if (!address) throw new Error('Username not found')
        friendAddress = address
      }
      
      return sendFriendRequest(wallet.publicKey, friendAddress)
    },
    {
      onSuccess: (txHash) => {
        queryClient.invalidateQueries(['friends'])
        setShowAddFriend(false)
        setFriendInput('')
        alert(`Friend request sent! Transaction: ${txHash.substring(0, 8)}...`)
      },
      onError: (error: any) => {
        alert(`Failed to add friend: ${error.message}`)
      }
    }
  )

  // Send message mutation
  const sendMessageMutation = useMutation(
    async () => {
      if (!wallet?.publicKey || !selectedFriend) throw new Error('Invalid state')
      const amountNum = amount ? parseFloat(amount) : 0
      return sendMessageToContract(wallet.publicKey, selectedFriend.address, message, amountNum)
    },
    {
      onSuccess: async (txHash) => {
        // Add message to chat immediately
        const newMsg = {
          from: wallet!.publicKey,
          to: selectedFriend!.address,
          message,
          amount: amount ? parseFloat(amount) : 0,
          timestamp: Date.now()
        }
        setChatMessages(prev => [...prev, newMsg])
        
        setMessage('')
        setAmount('')
        
        const displayMsg = amount 
          ? `Message and ${amount} XLM sent!` 
          : 'Message sent!'
        
        if (txHash.startsWith('local_')) {
          alert(displayMsg)
        } else {
          alert(`${displayMsg} Transaction: ${txHash.substring(0, 8)}...`)
        }
      },
      onError: (error: any) => {
        alert(`Failed to send message: ${error.message}`)
      }
    }
  )

  const handleAddFriend = () => {
    addFriendMutation.mutate()
  }

  const handleSendMessage = () => {
    sendMessageMutation.mutate()
  }

  const handleRegister = () => {
    registerMutation.mutate()
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Friends</h1>
          <p className="text-slate-400 mt-2">Connect with friends and send payments easily</p>
        </div>
        <div className="card text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-100 mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Please connect your wallet to manage friends</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Friends</h1>
          <p className="text-slate-400 mt-2">Connect with friends and send payments easily</p>
        </div>
        <button
          onClick={() => setShowAddFriend(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Friend</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Friends</h3>
            <div className="space-y-2">
              {friends.map((friend) => (
                <button
                  key={friend.address}
                  onClick={() => setSelectedFriend(friend)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedFriend?.address === friend.address
                      ? 'border-stellar-500 bg-stellar-50'
                      : 'border-slate-700/50 hover:border-stellar-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center text-white font-semibold">
                          {friend.displayName.charAt(0)}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{friend.displayName}</p>
                        <p className="text-sm text-slate-400">{friend.username}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat/Payment Interface */}
        <div className="lg:col-span-2">
          {selectedFriend ? (
            <div className="card">
              <div className="border-b border-slate-700/50 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedFriend.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {selectedFriend.displayName}
                    </h3>
                    <p className="text-sm text-slate-400">{selectedFriend.username}</p>
                  </div>
                </div>
              </div>

              {/* Message History */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-slate-800/50 rounded-lg p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-8">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    Start a conversation with {selectedFriend.displayName}
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isMe = msg.from === wallet?.publicKey
                    return (
                      <div
                        key={idx}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isMe
                              ? 'bg-stellar-600 text-white'
                              : 'bg-slate-900/80 border border-slate-700/50 text-slate-100'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          {msg.amount > 0 && (
                            <div className={`mt-2 pt-2 border-t ${isMe ? 'border-stellar-500' : 'border-slate-700/50'}`}>
                              <p className="text-xs font-semibold">
                                💰 {msg.amount} XLM
                              </p>
                            </div>
                          )}
                          <p className="text-xs mt-1 opacity-75">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Send Message/Payment */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount (XLM)"
                    className="input-field w-32"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message && !amount}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>{amount ? `Send ${amount} XLM` : 'Send Message'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card text-center py-24">
              <UserGroupIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">
                Select a Friend
              </h3>
              <p className="text-slate-400">
                Choose a friend from the list to start chatting and sending payments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Register Username Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <CheckCircleIcon className="h-12 w-12 text-stellar-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-slate-100">Register Your Username</h3>
              <p className="text-sm text-slate-400 mt-1">
                Choose a unique username to make it easy for friends to find you
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username (starts with @)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value)}
                  placeholder="@yourname"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Full Name"
                  className="input-field w-full"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={!username || !displayName || registerMutation.isLoading}
                className="btn-primary w-full"
              >
                {registerMutation.isLoading ? 'Registering...' : 'Register Username'}
              </button>
              <p className="text-xs text-slate-500 text-center">
                This will be stored on the Stellar blockchain
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Friend</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username or Wallet Address
                </label>
                <input
                  type="text"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  placeholder="@username or GXXX..."
                  className="input-field w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter @username or full wallet address
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddFriend(false)}
                  disabled={addFriendMutation.isLoading}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFriend}
                  disabled={!friendInput || addFriendMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {addFriendMutation.isLoading ? 'Adding...' : 'Add Friend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Friends
