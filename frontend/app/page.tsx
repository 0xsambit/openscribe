import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Nav */}
			<nav className="flex h-14 items-center justify-between border-b px-6">
				<span className="text-sm font-semibold tracking-tight">OpenScribe</span>
				<div className="flex items-center gap-1">
					<Link href="/docs">
						<Button variant="ghost" size="sm">
							Docs
						</Button>
					</Link>
					<Link href="/login">
						<Button variant="ghost" size="sm">
							Sign in
						</Button>
					</Link>
					<Link href="/register">
						<Button size="sm">Get Started</Button>
					</Link>
				</div>
			</nav>

			{/* Hero */}
			<main className="flex flex-1 flex-col items-center justify-center px-6">
				<div className="max-w-lg text-center">
					<p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
						Open-source &middot; Self-hosted
					</p>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						AI LinkedIn Content Strategist
					</h1>
					<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
						Analyze your writing style, generate data-driven strategies, and
						create posts that sound like you.
					</p>
					<div className="mt-8 flex items-center justify-center gap-3">
						<Link href="/register">
							<Button>Start Free</Button>
						</Link>
						<Link href="/docs">
							<Button variant="outline">Documentation</Button>
						</Link>
					</div>
				</div>

				{/* Feature grid */}
				<div className="mt-20 grid w-full max-w-2xl gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
					<div className="bg-card p-6">
						<p className="text-sm font-medium">Style Analysis</p>
						<p className="mt-1 text-xs text-muted-foreground">
							AI learns your tone, vocabulary, and engagement patterns.
						</p>
					</div>
					<div className="bg-card p-6">
						<p className="text-sm font-medium">Smart Strategy</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Personalized content calendars built from your data.
						</p>
					</div>
					<div className="bg-card p-6">
						<p className="text-sm font-medium">Content Generation</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Posts in your voice with iterative refinement.
						</p>
					</div>
				</div>

				{/* Command */}
				<div className="mt-10 mb-12 rounded-md border bg-card px-4 py-2 font-mono text-xs text-muted-foreground">
					<span className="mr-2 text-foreground">$</span>
					docker compose up -d
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t py-4 text-center text-xs text-muted-foreground">
				MIT License
			</footer>
		</div>
	);
}
