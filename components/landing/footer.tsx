export function Footer() {
  return (
    <footer className="py-10 border-t border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">SmarterEats</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a 
              href="mailto:hello@smartereats.ai" 
              className="hover:text-foreground transition-colors"
            >
              hello@smartereats.ai
            </a>
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SmarterEats. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
