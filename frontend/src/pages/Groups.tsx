import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserGroupIcon,
  PlusIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { groupService, Group, GroupMessage } from '../services/GroupService'
import { getFriends } from '../utils/socialContract'
import { splitPaymentInGroup } from '../utils/groupPayments'
import GroupExpenses from '../components/GroupExpenses'

const Groups: React.FC = () => {
  const { wallet } = useWallet()
  const queryClient = useQueryClient()
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showManageGroup, setShowManageGroup] = useState(false)
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [showExpenses, setShowExpenses] = useState(false)
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [splitAmount, setSplitAmount] = useState('')
  const [splitDescription, setSplitDescription] = useState('')

  // Get user's groups
  const { data: groups = [], refetch: refetchGroups } = useQuery(
    ['groups', wallet?.publicKey],
    () => wallet?.publicKey ? groupService.getUserGroups(wallet.publicKey) : [],
    { enabled: !!wallet?.publicKey }
  )

  // Get user's friends for adding to groups
  const { data: friends = [] } = useQuery(
    ['friends', wallet?.publicKey],
    () => wallet?.publicKey ? getFriends(wallet.publicKey) : [],
    { enabled: !!wallet?.publicKey }
  )

  // Load messages when group is selected
  useEffect(() => {
    if (selectedGroup) {
      const msgs = groupService.getMessages(selectedGroup.id)
      setMessages(msgs)
    }
  }, [selectedGroup])

  // Create group mutation
  const createGroupMutation = useMutation(
    async () => {
      if (!wallet?.publicKey || !groupName || selectedMembers.length === 0) {
        throw new Error('Please fill all fields')
      }
      return groupService.createGroup(groupName, selectedMembers, wallet.publicKey)
    },
    {
      onSuccess: (newGroup) => {
        refetchGroups()
        setShowCreateGroup(false)
        setGroupName('')
        setSelectedMembers([])
        setSelectedGroup(newGroup)
        alert('Group created successfully!')
      },
      onError: (error: any) => {
        alert(`Failed to create group: ${error.message}`)
      }
    }
  )

  // Send message mutation
  const sendMessageMutation = useMutation(
    async () => {
      if (!selectedGroup || !wallet?.publicKey) throw new Error('Invalid state')
      const amountNum = amount ? parseFloat(amount) : 0
      return groupService.sendMessage(
        selectedGroup.id,
        wallet.publicKey,
        message,
        amountNum,
        amountNum > 0 ? 'payment' : 'message'
      )
    },
    {
      onSuccess: (newMsg) => {
        setMessages(prev => [...prev, newMsg])
        setMessage('')
        setAmount('')
      },
      onError: (error: any) => {
        alert(`Failed to send message: ${error.message}`)
      }
    }
  )

  const handleCreateGroup = () => {
    createGroupMutation.mutate()
  }

  const handleSendMessage = () => {
    sendMessageMutation.mutate()
  }

  // Split payment mutation
  const splitPaymentMutation = useMutation(
    async () => {
      if (!selectedGroup || !wallet?.publicKey || !splitAmount) {
        throw new Error('Invalid state')
      }
      const amount = parseFloat(splitAmount)
      return splitPaymentInGroup(
        selectedGroup.id,
        wallet.publicKey,
        amount,
        splitDescription || 'Split payment',
        selectedGroup.members
      )
    },
    {
      onSuccess: (result) => {
        setShowSplitPayment(false)
        setSplitAmount('')
        setSplitDescription('')
        
        const successMsg = `✅ Split payment complete!\nSent to ${result.successful.length} members\nTotal: ${result.totalSent.toFixed(2)} XLM`
        const failMsg = result.failed.length > 0 ? `\n\n⚠️ ${result.failed.length} payment(s) failed` : ''
        alert(successMsg + failMsg)
        
        // Add system message
        if (selectedGroup && wallet?.publicKey) {
          groupService.sendMessage(
            selectedGroup.id,
            'system',
            `${wallet.publicKey.substring(0, 8)}... split ${splitAmount} XLM among the group`,
            0,
            'system'
          )
          setMessages(groupService.getMessages(selectedGroup.id))
        }
      },
      onError: (error: any) => {
        alert(`Failed to split payment: ${error.message}`)
      }
    }
  )

  const handleSplitPayment = () => {
    splitPaymentMutation.mutate()
  }

  const toggleMemberSelection = (address: string) => {
    setSelectedMembers(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    )
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-100">Groups</h1>
        <div className="card text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-100 mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Please connect your wallet to use group chats</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">Groups</h1>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Group</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Groups</h3>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No groups yet</p>
                <p className="text-xs mt-1">Create your first group!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'border-stellar-500 bg-stellar-50'
                        : 'border-slate-700/50 hover:border-stellar-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center text-white font-semibold">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{group.name}</p>
                          <p className="text-sm text-slate-400">{group.members.length} members</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Group Chat */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="card">
              <div className="border-b border-slate-700/50 pb-4 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{selectedGroup.name}</h3>
                    <p className="text-sm text-slate-400">{selectedGroup.members.length} members</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowManageGroup(true)}
                    className="p-2 text-slate-400 hover:text-stellar-600 hover:bg-slate-700/50 rounded-lg"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-slate-800/50 rounded-lg p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-8">
                    <UserGroupIcon className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.from === wallet.publicKey
                    const isSystem = msg.type === 'system'
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center">
                          <p className="text-xs text-slate-500 bg-slate-700/50 inline-block px-3 py-1 rounded-full">
                            {msg.message}
                          </p>
                        </div>
                      )
                    }
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isMe
                              ? 'bg-stellar-600 text-white'
                              : 'bg-slate-900/80 border border-slate-700/50 text-slate-100'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {msg.from.substring(0, 8)}...
                            </p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          {msg.amount && msg.amount > 0 && (
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

              {/* Send Message */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="input-field w-32"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={!message && !amount}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span>{amount ? `Send ${amount} XLM` : 'Send Message'}</span>
                  </button>
                  <button
                    onClick={() => setShowSplitPayment(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <CurrencyDollarIcon className="h-4 w-4" />
                    <span>Split Payment</span>
                  </button>
                  <button
                    onClick={() => setShowExpenses(true)}
                    className="btn-secondary"
                    title="View Expenses"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-24">
              <UserGroupIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Select a Group</h3>
              <p className="text-slate-400">Choose a group to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Modal */}
      {showExpenses && selectedGroup && (
        <GroupExpenses
          group={selectedGroup}
          onClose={() => setShowExpenses(false)}
        />
      )}

      {/* Split Payment Modal */}
      {showSplitPayment && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Split Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Amount (XLM)
                </label>
                <input
                  type="number"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="100"
                  className="input-field w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Each member will receive: {splitAmount ? (parseFloat(splitAmount) / selectedGroup.members.length).toFixed(2) : '0'} XLM
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={splitDescription}
                  onChange={(e) => setSplitDescription(e.target.value)}
                  placeholder="Dinner, rent, etc."
                  className="input-field w-full"
                />
              </div>
              <div className="bg-stellar-50 border border-stellar-200 rounded-lg p-3">
                <p className="text-sm text-stellar-900 font-medium mb-1">
                  Payment Summary
                </p>
                <p className="text-xs text-stellar-700">
                  • Total: {splitAmount || '0'} XLM<br />
                  • Recipients: {selectedGroup.members.length} members<br />
                  • Per person: {splitAmount ? (parseFloat(splitAmount) / selectedGroup.members.length).toFixed(2) : '0'} XLM
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSplitPayment(false)}
                  disabled={splitPaymentMutation.isLoading}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSplitPayment}
                  disabled={!splitAmount || splitPaymentMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {splitPaymentMutation.isLoading ? 'Processing...' : 'Split & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/80 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Create New Group</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Family, Work Team, etc."
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Add Members ({selectedMembers.length} selected)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {friends.map((friend) => (
                    <label
                      key={friend.address}
                      className="flex items-center space-x-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(friend.address)}
                        onChange={() => toggleMemberSelection(friend.address)}
                        className="rounded border-slate-700/50 text-stellar-600 focus:ring-stellar-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-stellar-400 to-stellar-600 flex items-center justify-center text-white text-sm font-semibold">
                          {friend.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">{friend.displayName}</p>
                          <p className="text-xs text-slate-400">{friend.username}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  disabled={createGroupMutation.isLoading}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName || selectedMembers.length === 0 || createGroupMutation.isLoading}
                  className="btn-primary flex-1"
                >
                  {createGroupMutation.isLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Groups
