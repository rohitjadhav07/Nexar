import React from 'react'

const AnimatedBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none bg-slate-950"
      style={{ zIndex: -1 }}
    />
  )
}

export default AnimatedBackground
