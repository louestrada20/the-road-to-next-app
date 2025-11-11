"use client"

import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { signUpPath, ticketsPath } from "@/paths"

export function CTASection() {
  const { user, isFetched } = useAuth()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-primary/10 overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(var(--primary) / 0.2), transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(var(--primary) / 0.2), transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(var(--primary) / 0.2), transparent 50%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          Ready to Transform Your Workflow?
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {user
            ? "Start managing tickets with bounties and collaborate with your team more effectively."
            : "Join teams already using TicketBounty to streamline their bug tracking and feature requests."}
        </motion.p>

        {isFetched && (
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild size="lg" className="text-base">
                  <Link href={ticketsPath()}>Go to Dashboard</Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild size="lg" className="text-base">
                  <Link href={signUpPath()}>Get Started Free</Link>
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}

