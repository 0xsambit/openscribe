"use client";

import { useAuthStore } from "@/stores/auth-store";
import { usePosts } from "@/hooks/use-posts";
import { useDrafts } from "@/hooks/use-drafts";
import { useCurrentStrategy } from "@/hooks/use-strategy";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const { data: postsData } = usePosts({ limit: 1 });
	const { data: draftsData } = useDrafts({ limit: 1 });
	const { data: strategyData } = useCurrentStrategy();

	const postCount = postsData?.pagination?.total ?? 0;
	const draftCount = draftsData?.pagination?.total ?? 0;
	const hasStrategy = !!strategyData?.data;

	return (
		<div className="mx-auto max-w-2xl space-y-10">
			{/* Greeting */}
			<div>
				<h1 className="text-lg font-semibold">
					Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Your content workspace overview.
				</p>
			</div>

			{/* Metrics */}
			<div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
				<Link
					href="/dashboard/posts"
					className="bg-card p-5 transition-colors hover:bg-secondary/40">
					<p className="text-2xl font-semibold tabular-nums">{postCount}</p>
					<p className="mt-1 text-xs text-muted-foreground">Posts</p>
				</Link>
				<Link
					href="/dashboard/drafts"
					className="bg-card p-5 transition-colors hover:bg-secondary/40">
					<p className="text-2xl font-semibold tabular-nums">{draftCount}</p>
					<p className="mt-1 text-xs text-muted-foreground">Drafts</p>
				</Link>
				<Link
					href="/dashboard/strategy"
					className="bg-card p-5 transition-colors hover:bg-secondary/40">
					<p className="text-2xl font-semibold">{hasStrategy ? "Active" : "None"}</p>
					<p className="mt-1 text-xs text-muted-foreground">Strategy</p>
				</Link>
			</div>

			{/* Quick actions */}
			<div className="space-y-1">
				<p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
					Quick actions
				</p>
				{postCount === 0 ? (
					<Link
						href="/dashboard/posts"
						className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
						Import LinkedIn Posts
						<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
					</Link>
				) : !hasStrategy ? (
					<Link
						href="/dashboard/strategy"
						className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
						Generate Strategy
						<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
					</Link>
				) : (
					<Link
						href="/dashboard/drafts"
						className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
						Generate New Content
						<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
					</Link>
				)}
				<Link
					href="/dashboard/settings"
					className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
					Configure AI Keys
					<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
				</Link>
				<Link
					href="/dashboard/analytics"
					className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
					View Analytics
					<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
				</Link>
			</div>

			{/* Getting started */}
			{postCount === 0 && (
				<div className="rounded-lg border p-5">
					<p className="text-sm font-medium mb-3">Getting started</p>
					<ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
						<li>Configure your AI provider in Settings</li>
						<li>Import your LinkedIn posts (CSV or JSON)</li>
						<li>Run style analysis and topic extraction</li>
						<li>Generate a content strategy</li>
						<li>Create posts in your voice</li>
					</ol>
				</div>
			)}
		</div>
	);
}
