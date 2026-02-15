import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
				<div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-2.5">
						<Link href="/" className="text-sm font-medium tracking-tight">
							OpenScribe
						</Link>
						<span className="text-muted-foreground">/</span>
						<span className="text-[11px] uppercase tracking-wide text-muted-foreground">
							Documentation
						</span>
					</div>
					<Link
						href="/dashboard"
						className="text-xs text-muted-foreground transition-colors hover:text-foreground">
						Dashboard
					</Link>
				</div>
			</header>
			<main>
				<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</div>
			</main>
			<footer className="border-t py-4 text-center text-[11px] text-muted-foreground">
				OpenScribe · Documentation
			</footer>
		</div>
	);
}
