import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="border-b">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
							OS
						</div>
						<span className="text-lg font-bold">OpenScribe</span>
					</div>
					<div className="flex items-center gap-3">
						<Link href="/login">
							<Button variant="ghost">Sign in</Button>
						</Link>
						<Link href="/register">
							<Button>Get Started</Button>
						</Link>
					</div>
				</div>
			</header>

			{/* Hero */}
			<main className="flex flex-1 items-center justify-center px-4">
				<div className="mx-auto max-w-3xl text-center">
					<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
						Your AI-Powered
						<br />
						<span className="text-primary">LinkedIn Content Strategist</span>
					</h1>
					<p className="mt-6 text-lg text-muted-foreground">
						Import your LinkedIn posts, analyze your writing style, generate
						data-driven strategies, and create engaging content that sounds
						authentically you. Open-source and self-hosted.
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						<Link href="/register">
							<Button size="lg">Start for Free</Button>
						</Link>
						<a
							href="https://github.com/openscribe"
							target="_blank"
							rel="noopener noreferrer">
							<Button variant="outline" size="lg">
								View on GitHub
							</Button>
						</a>
					</div>

					{/* Features */}
					<div className="mt-20 grid gap-8 sm:grid-cols-3 text-left">
						<div className="rounded-lg border p-6">
							<div className="mb-3 text-2xl">📊</div>
							<h3 className="font-semibold">Style Analysis</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								AI analyzes your writing patterns, tone, vocabulary, and
								what drives engagement.
							</p>
						</div>
						<div className="rounded-lg border p-6">
							<div className="mb-3 text-2xl">🎯</div>
							<h3 className="font-semibold">Smart Strategies</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Get personalized content calendars and posting strategies
								based on your data.
							</p>
						</div>
						<div className="rounded-lg border p-6">
							<div className="mb-3 text-2xl">✍️</div>
							<h3 className="font-semibold">Content Generation</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Generate posts in your unique voice with iterative feedback
								refinement.
							</p>
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t py-6 text-center text-sm text-muted-foreground">
				<p>OpenScribe is open-source software licensed under MIT.</p>
			</footer>
		</div>
	);
}
