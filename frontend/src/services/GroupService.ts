/**
 * GroupService - Manages group chats, members, and expenses
 * All data stored in localStorage for fast access
 */

export interface Group {
  id: string
  name: string
  admin: string // wallet address
  members: string[] // wallet addresses
  createdAt: number
  avatar?: string
}

export interface GroupMessage {
  id: string
  groupId: string
  from: string
  message: string
  amount?: number
  timestamp: number
  type: 'message' | 'payment' | 'system'
}

export interface GroupExpense {
  id: string
  groupId: string
  paidBy: string
  amount: number
  description: string
  splitAmong: string[]
  timestamp: number
  transactionHash?: string
}

export class GroupService {
  private static GROUPS_KEY = 'groups'
  
  // Group CRUD Operations
  
  createGroup(name: string, members: string[], admin: string): Group {
    const group: Group = {
      id: `group_${Date.now()}`,
      name,
      admin,
      members: [admin, ...members.filter(m => m !== admin)],
      createdAt: Date.now()
    }
    
    const groups = this.getAllGroups()
    groups.push(group)
    localStorage.setItem(GroupService.GROUPS_KEY, JSON.stringify(groups))
    
    return group
  }
  
  getGroup(groupId: string): Group | null {
    const groups = this.getAllGroups()
    return groups.find(g => g.id === groupId) || null
  }
  
  getUserGroups(userAddress: string): Group[] {
    const groups = this.getAllGroups()
    return groups.filter(g => g.members.includes(userAddress))
  }
  
  getAllGroups(): Group[] {
    const data = localStorage.getItem(GroupService.GROUPS_KEY)
    return data ? JSON.parse(data) : []
  }
  
  addMember(groupId: string, memberAddress: string): void {
    const groups = this.getAllGroups()
    const group = groups.find(g => g.id === groupId)
    
    if (group && !group.members.includes(memberAddress)) {
      group.members.push(memberAddress)
      localStorage.setItem(GroupService.GROUPS_KEY, JSON.stringify(groups))
      
      // Add system message
      this.sendMessage(groupId, 'system', `New member added: ${memberAddress}`, 0, 'system')
    }
  }
  
  removeMember(groupId: string, memberAddress: string): void {
    const groups = this.getAllGroups()
    const group = groups.find(g => g.id === groupId)
    
    if (group) {
      group.members = group.members.filter(m => m !== memberAddress)
      localStorage.setItem(GroupService.GROUPS_KEY, JSON.stringify(groups))
      
      // Add system message
      this.sendMessage(groupId, 'system', `Member removed: ${memberAddress}`, 0, 'system')
    }
  }
  
  deleteGroup(groupId: string): void {
    const groups = this.getAllGroups()
    const filtered = groups.filter(g => g.id !== groupId)
    localStorage.setItem(GroupService.GROUPS_KEY, JSON.stringify(filtered))
    
    // Clean up messages and expenses
    localStorage.removeItem(`group_messages_${groupId}`)
    localStorage.removeItem(`group_expenses_${groupId}`)
  }
  
  // Messaging
  
  sendMessage(
    groupId: string,
    from: string,
    message: string,
    amount: number = 0,
    type: 'message' | 'payment' | 'system' = 'message'
  ): GroupMessage {
    const msg: GroupMessage = {
      id: `msg_${Date.now()}`,
      groupId,
      from,
      message,
      amount,
      timestamp: Date.now(),
      type
    }
    
    const messages = this.getMessages(groupId)
    messages.push(msg)
    localStorage.setItem(`group_messages_${groupId}`, JSON.stringify(messages))
    
    return msg
  }
  
  getMessages(groupId: string): GroupMessage[] {
    const data = localStorage.getItem(`group_messages_${groupId}`)
    return data ? JSON.parse(data) : []
  }
  
  // Expense Tracking
  
  recordExpense(groupId: string, expense: GroupExpense): void {
    const expenses = this.getExpenses(groupId)
    expenses.push(expense)
    localStorage.setItem(`group_expenses_${groupId}`, JSON.stringify(expenses))
  }
  
  getExpenses(groupId: string): GroupExpense[] {
    const data = localStorage.getItem(`group_expenses_${groupId}`)
    return data ? JSON.parse(data) : []
  }
  
  calculateBalances(groupId: string): Map<string, number> {
    const expenses = this.getExpenses(groupId)
    const balances = new Map<string, number>()
    
    expenses.forEach(expense => {
      // Person who paid gets positive balance
      const currentPayer = balances.get(expense.paidBy) || 0
      balances.set(expense.paidBy, currentPayer + expense.amount)
      
      // People who owe get negative balance
      const amountPerPerson = expense.amount / expense.splitAmong.length
      expense.splitAmong.forEach(member => {
        const current = balances.get(member) || 0
        balances.set(member, current - amountPerPerson)
      })
    })
    
    return balances
  }
  
  suggestSettlements(groupId: string): Array<{from: string, to: string, amount: number}> {
    const balances = this.calculateBalances(groupId)
    const settlements: Array<{from: string, to: string, amount: number}> = []
    
    // Separate debtors and creditors
    const debtors: Array<{address: string, amount: number}> = []
    const creditors: Array<{address: string, amount: number}> = []
    
    balances.forEach((balance, address) => {
      if (balance < -0.01) {
        debtors.push({ address, amount: Math.abs(balance) })
      } else if (balance > 0.01) {
        creditors.push({ address, amount: balance })
      }
    })
    
    // Match debtors with creditors
    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i].amount
      const credit = creditors[j].amount
      const amount = Math.min(debt, credit)
      
      settlements.push({
        from: debtors[i].address,
        to: creditors[j].address,
        amount: Math.round(amount * 100) / 100
      })
      
      debtors[i].amount -= amount
      creditors[j].amount -= amount
      
      if (debtors[i].amount < 0.01) i++
      if (creditors[j].amount < 0.01) j++
    }
    
    return settlements
  }
}

// Export singleton instance
export const groupService = new GroupService()
