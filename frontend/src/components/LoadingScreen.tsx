import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LoadingScreenProps {
  onComplete: () => void
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
      >
        {/* Animated particles background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center">
          {/* Logo animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              {/* Glowing rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 -m-8"
              >
                <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 -m-12"
              >
                <div className="w-40 h-40 border-4 border-purple-500/20 rounded-full" />
              </motion.div>

              {/* Center logo */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                    '0 0 60px rgba(168, 85, 247, 0.8)',
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center"
              >
                <span className="text-3xl font-black text-white">N</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Brand name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-6xl font-black mb-4"
          >
            <span className="holographic">Nexar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-slate-400 text-lg mb-8"
          >
            Next-Gen Stellar Payments
          </motion.p>

          {/* Progress bar */}
          <div className="w-64 mx-auto">
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"
              />
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-slate-500 text-sm mt-4"
            >
              {progress}%
            </motion.p>
          </div>

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 flex items-center justify-center space-x-2"
          >
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-purple-500 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-pink-500 rounded-full"
            />
          </motion.div>
        </div>

        {/* Corner accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-br-full"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-tl-full"
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default LoadingScreen
