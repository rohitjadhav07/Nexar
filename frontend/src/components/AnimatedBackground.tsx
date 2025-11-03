import React, { useEffect, useRef, useState } from 'react'

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Particles
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }> = []

    // Create particles with blue tones only
    const colors = [
      'rgba(59, 130, 246, ', // blue
      'rgba(96, 165, 250, ', // light blue
      'rgba(37, 99, 235, ', // darker blue
    ]

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    // Floating orbs
    const orbs: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      color: string
    }> = []

    for (let i = 0; i < 2; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 80 + 40,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let time = 0

    // Animation loop
    const animate = () => {
      time += 0.01

      // Clear with fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy

        if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius
        if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius
        if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius
        if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius

        // Create gradient
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        gradient.addColorStop(0, orb.color + '0.15)')
        gradient.addColorStop(0.5, orb.color + '0.05)')
        gradient.addColorStop(1, orb.color + '0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction
        const dx = mouse.x - particle.x
        const dy = mouse.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          particle.vx -= (dx / distance) * force * 0.1
          particle.vy -= (dy / distance) * force * 0.1
        }

        // Apply velocity
        particle.x += particle.vx
        particle.y += particle.vy

        // Damping
        particle.vx *= 0.99
        particle.vy *= 0.99

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle with glow
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color + particle.opacity + ')'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + particle.opacity + ')'
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw connections (only nearby particles for performance)
        particles.slice(i + 1, i + 5).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            const opacity = 0.1 * (1 - distance / 100)
            ctx.strokeStyle = particle.color + opacity + ')'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      // Removed mouse glow for better performance

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouse.x, mouse.y])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        zIndex: -1,
      }}
    />
  )
}

export default AnimatedBackground
