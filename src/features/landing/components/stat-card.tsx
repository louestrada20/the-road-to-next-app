"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef,useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

type StatCardProps = {
  value: number | string
  label: string
  icon: React.ReactNode
  prefix?: string
}

export function StatCard({ value, label, icon, prefix }: StatCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [displayValue, setDisplayValue] = useState(0)

  const numericValue = typeof value === "number" ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ""))
  const isNumber = typeof value === "number" || !isNaN(numericValue)

  useEffect(() => {
    if (!isInView || !isNumber) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = numericValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(numericValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isInView, numericValue, isNumber])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all overflow-hidden relative group bg-gradient-to-br from-background via-background to-primary/5">
        {/* Golden corner accents - all four corners for stat cards */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary/30 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary/30 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary/30 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary/30 rounded-br-lg" />

        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        />

        {/* Subtle scan line effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none"
          animate={{
            backgroundPosition: ["0% 0%", "0% 100%"],
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

        <CardContent className="flex flex-col items-center justify-center p-8 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          >
            {icon}
          </motion.div>
          <div className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
            {prefix}
            {isNumber ? displayValue.toLocaleString() : value}
          </div>
          <div className="text-sm text-muted-foreground text-center font-medium uppercase tracking-wider">{label}</div>
        </CardContent>

        {/* Top accent line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        />
        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </Card>
    </motion.div>
  )
}

