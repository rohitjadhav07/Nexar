import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Tilt from 'react-parallax-tilt'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
  tiltEnabled?: boolean
}

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blue',
  tiltEnabled = true,
}) => {
  const glowColors = {
    blue: 'rgba(59, 130, 246, 0.5)',
    purple: 'rgba(168, 85, 247, 0.5)',
    green: 'rgba(34, 197, 94, 0.5)',
    pink: 'rgba(236, 72, 153, 0.5)',
    cyan: 'rgba(6, 182, 212, 0.5)',
  }

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative group ${className}`}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glowColors[glowColor as keyof typeof glowColors] || glowColors.blue}, transparent)`,
        }}
      />

      {/* Card content */}
      <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border animate-spin-slow" style={{ WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </motion.div>
  )

  if (tiltEnabled) {
    return (
      <Tilt
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        perspective={1000}
        scale={1}
        transitionSpeed={2000}
        gyroscope={true}
      >
        {CardContent}
      </Tilt>
    )
  }

  return CardContent
}

export default GlowCard
