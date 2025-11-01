import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CommandContextType {
  triggerCommand: (command: string) => void
  onCommandTrigger: (callback: (command: string) => void) => void
}

const CommandContext = createContext<CommandContextType | undefined>(undefined)

export const useCommand = () => {
  const context = useContext(CommandContext)
  if (context === undefined) {
    throw new Error('useCommand must be used within a CommandProvider')
  }
  return context
}

interface CommandProviderProps {
  children: ReactNode
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children }) => {
  const [commandCallback, setCommandCallback] = useState<((command: string) => void) | null>(null)

  const triggerCommand = (command: string) => {
    if (commandCallback) {
      commandCallback(command)
    }
  }

  const onCommandTrigger = (callback: (command: string) => void) => {
    setCommandCallback(() => callback)
  }

  return (
    <CommandContext.Provider value={{ triggerCommand, onCommandTrigger }}>
      {children}
    </CommandContext.Provider>
  )
}
