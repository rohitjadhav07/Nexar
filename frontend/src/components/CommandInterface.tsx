import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import AIBrainIcon from '../assets/icons/ai-brain.svg'
import { AgentResponse } from '../types'
import { useWallet } from '../contexts/WalletContext'
import { useCommand } from '../contexts/CommandContext'
import { sendPayment } from '../utils/stellarTransactions'
import { searchUsername } from '../utils/socialContract'
import { groupService } from '../services/GroupService'
import { splitPaymentInGroup } from '../utils/groupPayments'
import { receiptService } from '../services/ReceiptService'
import axios from 'axios'

interface CommandMessage {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: Date
  data?: any
}

const CommandInterface: React.FC = () => {
  const { wallet } = useWallet()
  const { onCommandTrigger } = useCommand()
  const [command, setCommand] = useState('')
  const [messages, setMessages] = useState<CommandMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hi! I\'m your AI payment assistant. Try commands like "Ask 50 USDC from @alice for design work" or click a Quick Action button →',
      timestamp: new Date(),
    }
  ])

  // Listen for triggered commands from QuickActions
  useEffect(() => {
    onCommandTrigger((triggeredCommand: string) => {
      setCommand(triggeredCommand)
      // Focus the input field so user can review and edit
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement
        if (input) {
          input.focus()
        }
      }, 100)
    })
  }, [onCommandTrigger])

  const sendCommandMutation = useMutation(
    async (command: string): Promise<AgentResponse> => {
      const response = await axios.post('/api/command', { 
        command,
        userPublicKey: wallet?.publicKey 
      })
      return response.data
    },
    {
      onSuccess: async (response) => {
        // Check if this requires a transaction to be signed
        if (response.data?.requiresSignature && response.data?.contractCallXDR) {
          try {
            // Parse the contract call data
            const callData = JSON.parse(response.data.contractCallXDR)
            
            // If it's a simple payment, execute it directly
            if (callData.method === 'create_invoice' && wallet?.publicKey) {
              const agentMessage: CommandMessage = {
                id: Date.now().toString(),
                type: 'agent',
                content: '🔄 Executing transaction... Please approve in Freighter.',
                timestamp: new Date(),
              }
              setMessages(prev => [...prev, agentMessage])
              
              // Resolve username if needed
              let recipientAddress = callData.params.recipient
              if (recipientAddress.startsWith('@')) {
                const resolvedAddress = await searchUsername(recipientAddress)
                if (!resolvedAddress) {
                  throw new Error(`Username ${recipientAddress} not found`)
                }
                recipientAddress = resolvedAddress
              }
              
              // Execute the payment
              const txHash = await sendPayment({
                from: wallet.publicKey,
                to: recipientAddress,
                amount: callData.params.amount.toString(),
              })
              
              const successMessage: CommandMessage = {
                id: Date.now().toString(),
                type: 'agent',
                content: `✅ Transaction successful!\n\nSent ${callData.params.amount} ${callData.params.currency} to ${callData.params.recipient}${recipientAddress !== callData.params.recipient ? ` (${recipientAddress.substring(0, 8)}...)` : ''}\n\nTransaction: ${txHash.substring(0, 8)}...${txHash.substring(txHash.length - 8)}\n\nView on Stellar Expert: https://stellar.expert/explorer/testnet/tx/${txHash}`,
                timestamp: new Date(),
              }
              setMessages(prev => [...prev, successMessage])
              return
            }
          } catch (error: any) {
            const errorMessage: CommandMessage = {
              id: Date.now().toString(),
              type: 'agent',
              content: `❌ Transaction failed: ${error.message}\n\nPlease make sure:\n• Your wallet is unlocked\n• You have enough XLM balance\n• The recipient address is valid`,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
            return
          }
        }
        
        // Regular message response
        const agentMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: response.message,
          timestamp: new Date(),
          data: response.data,
        }
        setMessages(prev => [...prev, agentMessage])
      },
      onError: (error) => {
        const errorMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: 'Sorry, I encountered an error processing your command. Please try again.',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    // Add user message
    const userMessage: CommandMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Try to handle command locally first
    const handled = await handleLocalCommand(command.toLowerCase())
    if (handled) {
      setCommand('')
      return
    }

    // Send to AI agent
    sendCommandMutation.mutate(command)
    setCommand('')
  }

  const handleLocalCommand = async (cmd: string): Promise<boolean> => {
    if (!wallet?.publicKey) return false

    try {
      // Create group command: "create group [name] with @user1 @user2"
      const createGroupMatch = cmd.match(/create group (\w+) with (.+)/)
      if (createGroupMatch) {
        const groupName = createGroupMatch[1]
        const usernamesStr = createGroupMatch[2]
        const usernames = usernamesStr.match(/@\w+/g) || []
        
        const agentMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `🔄 Creating group "${groupName}" with ${usernames.length} member(s)...`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMessage])

        // Resolve usernames to addresses
        const members: string[] = []
        for (const username of usernames) {
          const address = await searchUsername(username)
          if (address) members.push(address)
        }

        if (members.length === 0) {
          throw new Error('No valid members found')
        }

        const group = groupService.createGroup(groupName, members, wallet.publicKey)
        
        const successMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `✅ Group "${groupName}" created successfully with ${members.length} member(s)!\n\nYou can now send messages and split payments in this group.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, successMessage])
        return true
      }

      // Split payment command: "split [amount] in [group]"
      const splitMatch = cmd.match(/split (\d+(?:\.\d+)?) (?:xlm )?in (\w+)/)
      if (splitMatch) {
        const amount = parseFloat(splitMatch[1])
        const groupName = splitMatch[2]
        
        const groups = groupService.getUserGroups(wallet.publicKey)
        const group = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase())
        
        if (!group) {
          throw new Error(`Group "${groupName}" not found`)
        }

        const agentMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `🔄 Splitting ${amount} XLM among ${group.members.length} members in "${group.name}"...`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMessage])

        const result = await splitPaymentInGroup(
          group.id,
          wallet.publicKey,
          amount,
          'Split payment via AI command',
          group.members
        )

        const successMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `✅ Split payment complete!\n\n• Sent to ${result.successful.length} member(s)\n• Total sent: ${result.totalSent.toFixed(2)} XLM\n• Per person: ${(amount / group.members.length).toFixed(2)} XLM${result.failed.length > 0 ? `\n\n⚠️ ${result.failed.length} payment(s) failed` : ''}`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, successMessage])
        return true
      }

      // Generate receipt command: "generate receipt" or "receipt for last transaction"
      if (cmd.includes('generate receipt') || cmd.includes('receipt for')) {
        const agentMessage: CommandMessage = {
          id: Date.now().toString(),
          type: 'agent',
          content: `📄 To generate a receipt, please go to the Transactions page and click the "Generate" button next to any transaction.\n\nYou can also export all transactions using the "Export" button.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, agentMessage])
        return true
      }

      return false
    } catch (error: any) {
      const errorMessage: CommandMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      return true
    }
  }

  const exampleCommands = [
    'Ask 50 USDC from @alice for design work',
    'Split 100 XLM in Family group',
    'Create group Team with @alice @bob',
    'Generate receipt for last transaction',
    'Show my transaction history',
  ]

  return (
    <div className="card relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur-lg opacity-30"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-lg">
              <img src={AIBrainIcon} alt="AI" className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">AI Payment Assistant</h2>
            <p className="text-xs text-slate-500">Powered by GPT-4</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400 font-medium">Online</span>
        </div>
      </div>

      {/* Chat Messages - Dark theme */}
      <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {sendCommandMutation.isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom duration-300">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-200 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm font-medium">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command Input - Dark theme */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ask me anything... 'Split 100 XLM in Family group'"
            className="input-field flex-1"
            disabled={sendCommandMutation.isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!command.trim() || sendCommandMutation.isLoading}
          className="btn-primary flex items-center space-x-2 px-6"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      {/* Example Commands */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-400 mb-3">
          Quick Commands:
        </p>
        <div className="flex flex-wrap gap-2">
          {exampleCommands.map((example, index) => (
            <button
              key={index}
              onClick={() => setCommand(example)}
              className="text-xs font-medium bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommandInterface