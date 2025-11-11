"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TechCardProps = {
  name: string
  description: string
  icon: React.ReactNode
  index?: number
}

export function TechCard({ name, description, icon, index = 0 }: TechCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 15
    const y = (e.clientY - rect.top - rect.height / 2) / 15
    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 })
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay: index * 0.05, type: "spring" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      whileHover={{ scale: 1.03 }}
    >
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      >
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all relative overflow-hidden group cursor-pointer bg-gradient-to-br from-background via-background to-primary/5">
          {/* Golden corner accents - top right and bottom left */}
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary/30 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary/30 rounded-bl-lg" />

          {/* Floating gradient spotlight */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle 150px at ${50 + mousePosition.x * 2}% ${50 + mousePosition.y * 2}%, rgba(var(--primary) / 0.08), transparent 70%)`,
            }}
          />

          {/* Subtle scan line effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none"
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

          <CardHeader className="relative z-10 pb-3">
            <motion.div
              className="mb-3 flex items-center justify-center text-4xl"
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? [0, -3, 3, 0] : 0,
              }}
              transition={{
                scale: { type: "spring", stiffness: 300, damping: 20 },
                rotate: { duration: 0.4 }
              }}
            >
              {icon}
            </motion.div>
            <CardTitle className="text-center text-lg font-bold">{name}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <CardDescription className="text-center text-sm leading-relaxed">{description}</CardDescription>
          </CardContent>

          {/* Diagonal accent line */}
          <motion.div
            className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </Card>
      </motion.div>
    </motion.div>
  )
}

