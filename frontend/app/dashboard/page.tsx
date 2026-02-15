"use client";

import { useAuthStore } from "@/stores/auth-store";
import { usePosts } from "@/hooks/use-posts";
import { useDrafts } from "@/hooks/use-drafts";
import { useCurrentStrategy } from "@/hooks/use-strategy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PenTool, Target, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
	const user = useAuthStore((s) => s.user);
	const { data: postsData } = usePosts({ limit: 1 });
	const { data: draftsData } = useDrafts({ limit: 1 });
	const { data: strategyData } = useCurrentStrategy();

	const postCount = postsData?.pagination?.total ?? 0;
	const draftCount = draftsData?.pagination?.total ?? 0;
	const hasStrategy = !!strategyData?.data;

	const stats = [
		{ title: "Imported Posts", value: postCount, icon: FileText, href: "/dashboard/posts" },
		{
			title: "Generated Drafts",
			value: draftCount,
			icon: PenTool,
			href: "/dashboard/drafts",
		},
		{
			title: "Active Strategy",
			value: hasStrategy ? "Yes" : "None",
			icon: Target,
			href: "/dashboard/strategy",
		},
		{ title: "Analytics", value: "View", icon: BarChart3, href: "/dashboard/analytics" },
	];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">
					Welcome back, {user?.name?.split(" ")[0] ?? "there"}!
				</h1>
				<p className="mt-1 text-muted-foreground">
					Here&apos;s an overview of your content workspace.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Link key={stat.title} href={stat.href}>
						<Card className="transition-shadow hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									{stat.title}
								</CardTitle>
								<stat.icon className="h-5 w-5 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stat.value}</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-3">
					{postCount === 0 ? (
						<Link href="/dashboard/posts">
							<Button variant="outline" className="w-full justify-between">
								Import LinkedIn Posts <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					) : !hasStrategy ? (
						<Link href="/dashboard/strategy">
							<Button variant="outline" className="w-full justify-between">
								Generate Strategy <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					) : (
						<Link href="/dashboard/drafts">
							<Button variant="outline" className="w-full justify-between">
								Generate New Content <ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					)}
					<Link href="/dashboard/settings">
						<Button variant="outline" className="w-full justify-between">
							Configure AI Keys <ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
					<Link href="/dashboard/analytics">
						<Button variant="outline" className="w-full justify-between">
							View Analytics <ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				</CardContent>
			</Card>

			{/* Getting Started Guide */}
			{postCount === 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Getting Started</CardTitle>
					</CardHeader>
					<CardContent>
						<ol className="ml-4 list-decimal space-y-3 text-sm text-muted-foreground">
							<li className="pl-2">
								<strong className="text-foreground">
									Configure AI Provider
								</strong>{" "}
								— Add your OpenAI, Anthropic, or Ollama API key in Settings.
							</li>
							<li className="pl-2">
								<strong className="text-foreground">
									Import LinkedIn Posts
								</strong>{" "}
								— Upload a CSV or JSON export of your LinkedIn activity.
							</li>
							<li className="pl-2">
								<strong className="text-foreground">Run Analysis</strong> —
								Let AI analyze your writing style and top-performing topics.
							</li>
							<li className="pl-2">
								<strong className="text-foreground">
									Generate Strategy
								</strong>{" "}
								— Get a personalized content calendar based on your data.
							</li>
							<li className="pl-2">
								<strong className="text-foreground">Create Content</strong>{" "}
								— Generate LinkedIn posts in your unique voice with
								iterative refinement.
							</li>
						</ol>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
