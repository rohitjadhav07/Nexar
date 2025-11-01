import React, { useEffect, useState } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Notification, NotificationType } from '../services/NotificationService'

interface ToastProps {
  notification: Notification
  onClose: () => void
  duration?: number
}

const Toast: React.FC<ToastProps> = ({ notification, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10)

    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />
    }
  }

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10'
      case 'error':
        return 'border-red-500/30 bg-red-500/10'
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10'
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10'
    }
  }

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-slate-900/95 backdrop-blur-xl rounded-lg border ${getStyles(notification.type)} p-4 shadow-2xl min-w-[320px] max-w-md`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">
              {notification.title}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {notification.message}
            </p>
            
            {notification.actionUrl && notification.actionLabel && (
              <button
                onClick={() => {
                  window.location.href = notification.actionUrl!
                  onClose()
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-2"
              >
                {notification.actionLabel} →
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
