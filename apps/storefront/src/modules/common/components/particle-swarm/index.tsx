"use client"

import { useEffect, useRef } from "react"

/**
 * Advanced Boids animation — simulates bird-like (swallow) flocking.
 * - Distributed "cloud" at rest with organic undulation.
 * - Coordinated swarming when mouse moves.
 * - Maintains volume (doesn't collapse into a single point).
 */
export default function ParticleSwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const palette = [
      "#7090AB", // pacific
      "#8BA3B8", // lightened
      "#5A7A94", // darkened
      "#9CA3A8", // fog
      "#B8C4CC", // fog lightened
    ]

    const isMobile = window.innerWidth < 768
    const BOID_COUNT = isMobile ? 160 : 350
    const VISUAL_RANGE = 90
    const PROTECTED_RANGE = 25
    const CENTER_PULL = 0.00015
    const AVOID_FACTOR = 0.04
    const MATCH_FACTOR = 0.04
    const SPEED_LIMIT = 0.45 // Cloud-slow drift
    const MIN_SPEED = 0.06

    const MOUSE_RADIUS = 250
    const MOUSE_PULL = 0.002
    const WANDER_STRENGTH = 0.018 // Very gentle — smooth cloud undulation

    let dpr = 1
    let boids: {
      x: number
      y: number
      vx: number
      vy: number
      angle: number
      color: string
      length: number
      thickness: number
      opacity: number
    }[] = []
    let mouse = { x: -9999, y: -9999 }
    let animId = 0

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseout", onLeave)

    for (let i = 0; i < BOID_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      boids.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: Math.cos(angle) * MIN_SPEED,
        vy: Math.sin(angle) * MIN_SPEED,
        angle,
        color: palette[Math.floor(Math.random() * palette.length)],
        length: 5 + Math.random() * 10,
        thickness: 1.0 + Math.random() * 1.0,
        opacity: 0.15 + Math.random() * 0.35,
      })
    }

    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      for (const b of boids) {
        let close_dx = 0
        let close_dy = 0
        let avg_vx = 0
        let avg_vy = 0
        let avg_x = 0
        let avg_y = 0
        let neighbors = 0

        for (const other of boids) {
          if (b === other) continue

          const dx = b.x - other.x
          const dy = b.y - other.y
          const distSq = dx * dx + dy * dy

          if (distSq < VISUAL_RANGE * VISUAL_RANGE) {
            if (distSq < PROTECTED_RANGE * PROTECTED_RANGE) {
              close_dx += dx
              close_dy += dy
            } else {
              avg_vx += other.vx
              avg_vy += other.vy
              avg_x += other.x
              avg_y += other.y
              neighbors++
            }
          }
        }

        if (neighbors > 0) {
          avg_vx /= neighbors
          avg_vy /= neighbors
          avg_x /= neighbors
          avg_y /= neighbors

          b.vx += (avg_vx - b.vx) * MATCH_FACTOR
          b.vy += (avg_vy - b.vy) * MATCH_FACTOR
          b.vx += (avg_x - b.x) * CENTER_PULL
          b.vy += (avg_y - b.y) * CENTER_PULL
        }

        b.vx += close_dx * AVOID_FACTOR
        b.vy += close_dy * AVOID_FACTOR

        // Organic undulation (wander) — very gentle, cloud-like
        b.angle += (Math.random() - 0.5) * WANDER_STRENGTH
        b.vx += Math.cos(b.angle) * 0.006
        b.vy += Math.sin(b.angle) * 0.006

        // Smooth Mouse Orbiting (No spazziness)
        const mdx = mouse.x - b.x
        const mdy = mouse.y - b.y
        const mDistSq = mdx * mdx + mdy * mdy
        if (mDistSq < MOUSE_RADIUS * MOUSE_RADIUS) {
          const mDist = Math.sqrt(mDistSq)

          // Target an orbit distance (e.g., 70px)
          const targetDist = 70
          const distError = mDist - targetDist

          // Continuous smooth radial force (attract if far, repel if close)
          const radialForce = distError * 0.0005
          b.vx += mdx * radialForce
          b.vy += mdy * radialForce

          // Gentle tangential force for soft circling
          const tangentStrength = 0.008
          b.vx += (mdy / mDist) * tangentStrength
          b.vy -= (mdx / mDist) * tangentStrength
        }

        // Smooth boundary steering
        const margin = 100
        const turn = 0.02
        if (b.x < margin) b.vx += turn
        if (b.x > w - margin) b.vx -= turn
        if (b.y < margin) b.vy += turn
        if (b.y > h - margin) b.vy -= turn

        // Screen wrap (teleport edges with buffer)
        if (b.x < -40) b.x = w + 40
        if (b.x > w + 40) b.x = -40
        if (b.y < -40) b.y = h + 40
        if (b.y > h + 40) b.y = -40

        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
        if (speed > SPEED_LIMIT) {
          b.vx = (b.vx / speed) * SPEED_LIMIT
          b.vy = (b.vy / speed) * SPEED_LIMIT
        }
        if (speed < MIN_SPEED) {
          b.vx = (b.vx / speed) * MIN_SPEED
          b.vy = (b.vy / speed) * MIN_SPEED
        }

        b.x += b.vx
        b.y += b.vy

        // Draw oriented dash
        const moveAngle = Math.atan2(b.vy, b.vx)
        ctx.save()
        ctx.globalAlpha = b.opacity
        ctx.translate(b.x, b.y)
        ctx.rotate(moveAngle)
        ctx.beginPath()
        ctx.moveTo(-b.length / 2, 0)
        ctx.lineTo(b.length / 2, 0)
        ctx.strokeStyle = b.color
        ctx.lineWidth = b.thickness
        ctx.lineCap = "round"
        ctx.stroke()
        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseout", onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
