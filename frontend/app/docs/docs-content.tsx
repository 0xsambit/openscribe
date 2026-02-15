"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-");
}

function HeadingRenderer({ level, children }: { level: number; children: React.ReactNode }) {
	const text = React.Children.toArray(children)
		.map((child) => (typeof child === "string" ? child : ""))
		.join("");
	const id = slugify(text);

	return React.createElement(`h${level}`, { id, className: "scroll-mt-24" }, children);
}

export function DocsContent({ content }: { content: string }) {
	return (
		<article className="prose prose-sm dark:prose-invert max-w-none prose-p:text-sm prose-p:leading-6 prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-1 prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-a:text-foreground prose-a:underline prose-a:underline-offset-2 prose-strong:text-foreground prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:px-4 prose-pre:py-3 prose-table:text-sm prose-table:my-4 prose-th:text-left prose-th:font-medium prose-th:border-b prose-th:border-border prose-td:py-2 prose-th:py-2 prose-hr:border-border">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					h1: ({ children }) => (
						<HeadingRenderer level={1}>{children}</HeadingRenderer>
					),
					h2: ({ children }) => (
						<HeadingRenderer level={2}>{children}</HeadingRenderer>
					),
					h3: ({ children }) => (
						<HeadingRenderer level={3}>{children}</HeadingRenderer>
					),
				}}>
				{content}
			</ReactMarkdown>
		</article>
	);
}
