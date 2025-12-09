import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">McKinney One</h1>
        <p className="text-lg text-muted-foreground">Platform Initialized</p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
