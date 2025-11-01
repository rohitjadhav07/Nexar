import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { Notification, notificationService } from '../services/NotificationService'

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([])

  useEffect(() => {
    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setToasts(prev => [...prev, notification])
    })

    return unsubscribe
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    notificationService.markAsRead(id)
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            notification={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ToastContainer
