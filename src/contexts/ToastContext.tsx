import { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastType } from '../components/Toast'

interface ToastData {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message: string, duration?: number) => {
    showToast('success', message, duration)
  }

  const showError = (message: string, duration?: number) => {
    showToast('error', message, duration)
  }

  const showWarning = (message: string, duration?: number) => {
    showToast('warning', message, duration)
  }

  const showInfo = (message: string, duration?: number) => {
    showToast('info', message, duration)
  }

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
          duration={3000}
        />
      ))}
    </ToastContext.Provider>
  )
}
