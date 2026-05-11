import { motion } from 'motion/react'

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay',
      }} />
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="font-mono text-2xl font-semibold text-foreground">mmaly</span>
            <span className="font-mono text-2xl font-bold text-primary">.cz</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 Mikoláš Malý.</p>
        </motion.div>
      </div>
    </footer>
  )
}
