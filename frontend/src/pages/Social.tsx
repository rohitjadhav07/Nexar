import React, { useState } from 'react'
import Friends from './Friends'
import Groups from './Groups'
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'

const Social: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black gradient-text">Social</h1>
          <p className="text-slate-400 mt-1">Manage your friends and payment groups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800/50">
        <button
          onClick={() => setActiveTab('friends')}
          className={`relative flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === 'friends'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserGroupIcon className="h-5 w-5" />
          <span>Friends</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`relative flex items-center space-x-2 px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === 'groups'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UsersIcon className="h-5 w-5" />
          <span>Groups</span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'friends' ? <Friends /> : <Groups />}
      </div>
    </div>
  )
}

export default Social
