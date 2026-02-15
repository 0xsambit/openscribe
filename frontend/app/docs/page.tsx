import fs from "fs";
import path from "path";
import { DocsContent } from "./docs-content";

export const metadata = {
	title: "Documentation — OpenScribe",
	description: "Learn how to set up and use OpenScribe, the AI LinkedIn Content Strategist.",
};

function getDocsContent(): string {
	// Read USAGE.md from the project root (two levels up from frontend/app/docs)
	const usagePath = path.join(process.cwd(), "..", "USAGE.md");
	try {
		return fs.readFileSync(usagePath, "utf-8");
	} catch {
		// Fallback: try relative to workspace root
		try {
			return fs.readFileSync(path.join(process.cwd(), "USAGE.md"), "utf-8");
		} catch {
			return "# Documentation\n\nDocumentation file not found. Please ensure `USAGE.md` exists in the project root.";
		}
	}
}

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
	const headingRegex = /^(#{1,3})\s+(.+)$/gm;
	const headings: { id: string; text: string; level: number }[] = [];
	let match;
	while ((match = headingRegex.exec(markdown)) !== null) {
		const level = match[1].length;
		const text = match[2].trim();
		const id = text
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-");
		headings.push({ id, text, level });
	}
	return headings;
}

export default function DocsPage() {
	const content = getDocsContent();
	const headings = extractHeadings(content);
	const tocHeadings = headings.filter((heading) => heading.level >= 2 && heading.level <= 3);
	const sectionCount = tocHeadings.filter((heading) => heading.level === 2).length;

	return (
		<div className="space-y-6">
			<section className="rounded-lg border p-4 sm:p-6">
				<p className="text-[11px] uppercase tracking-wider text-muted-foreground">
					Documentation
				</p>
				<h1 className="mt-1 text-lg font-medium tracking-tight">OpenScribe Guide</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
					Everything you need to set up, configure, and use OpenScribe effectively.
				</p>
				<div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
					<span className="rounded border px-2 py-1">{sectionCount} sections</span>
					<span className="rounded border px-2 py-1">
						{tocHeadings.length} topics
					</span>
				</div>
			</section>

			<details className="rounded-lg border p-3 lg:hidden">
				<summary className="cursor-pointer list-none text-xs font-medium text-foreground">
					Jump to section
				</summary>
				<nav className="mt-3 space-y-px">
					{tocHeadings.map((heading) => (
						<a
							key={heading.id}
							href={`#${heading.id}`}
							className={`block rounded px-2 py-1 text-xs leading-relaxed transition-colors hover:bg-secondary hover:text-foreground ${
								heading.level === 2
									? "font-medium text-foreground"
									: "pl-4 text-muted-foreground"
							}`}>
							{heading.text}
						</a>
					))}
				</nav>
			</details>

			<div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
				<aside className="hidden lg:block">
					<div className="sticky top-20 rounded-lg border p-3">
						<p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
							Contents
						</p>
						<nav className="max-h-[calc(100vh-8rem)] space-y-px overflow-auto pr-1">
							{tocHeadings.map((heading) => (
								<a
									key={heading.id}
									href={`#${heading.id}`}
									className={`block rounded px-2 py-1 text-xs leading-relaxed transition-colors hover:bg-secondary hover:text-foreground ${
										heading.level === 2
											? "font-medium text-foreground"
											: "pl-4 text-muted-foreground"
									}`}>
									{heading.text}
								</a>
							))}
						</nav>
					</div>
				</aside>

				<div className="min-w-0 rounded-lg border p-4 sm:p-6">
					<DocsContent content={content} />
				</div>
			</div>
		</div>
	);
}
