"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type FeatureCardProps = {
  title: string
  description: string
  icon: React.ReactNode
  index?: number
}

export function FeatureCard({ title, description, icon, index = 0 }: FeatureCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 25
    const y = (e.clientY - rect.top - rect.height / 2) / 25
    setMousePosition({ x, y })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePosition({ x: 0, y: 0 })
      }}
      style={{
        perspective: "1000px",
      }}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? mousePosition.y : 0,
          rotateY: isHovered ? mousePosition.x : 0,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all relative overflow-hidden group bg-gradient-to-br from-background via-background to-primary/5">
          {/* Golden corner accents - top left */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/30 rounded-tl-lg" />
          {/* Golden corner accents - bottom right */}
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary/30 rounded-br-lg" />

          {/* Animated gradient spotlight */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle 200px at ${50 + mousePosition.x * 3}% ${50 + mousePosition.y * 3}%, rgba(var(--primary) / 0.08), transparent 70%)`,
            }}
          />

          {/* Subtle scan line effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-30 pointer-events-none"
            animate={{
              backgroundPosition: isHovered ? ["0% 0%", "0% 100%"] : "0% 0%",
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: "linear-gradient(transparent 50%, rgba(var(--primary) / 0.03) 50%)",
              backgroundSize: "100% 4px",
            }}
          />

          <CardHeader className="relative z-10">
            <motion.div
              className="mb-4 text-primary flex items-center justify-center w-16 h-16 mx-auto rounded-lg bg-primary/10 border border-primary/20"
              animate={{
                scale: isHovered ? 1.05 : 1,
                rotate: isHovered ? [0, -2, 2, 0] : 0,
              }}
              transition={{
                scale: { type: "spring", stiffness: 300, damping: 20 },
                rotate: { duration: 0.4 }
              }}
            >
              {icon}
            </motion.div>
            <CardTitle className="text-xl text-center font-bold tracking-tight">{title}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <CardDescription className="text-base text-center leading-relaxed">{description}</CardDescription>
          </CardContent>

          {/* Bottom accent line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </Card>
      </motion.div>
    </motion.div>
  )
}

