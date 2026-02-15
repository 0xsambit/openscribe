"use client";

import { useState, useCallback } from "react";
import { usePosts, useUploadPosts, useDeletePost } from "@/hooks/use-posts";
import { useStartStyleAnalysis, useStartTopicExtraction } from "@/hooks/use-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Upload, Search, Trash2, Brain, Tags } from "lucide-react";
import { formatDate, truncate, calculateEngagementScore } from "@/lib/utils";

export default function PostsPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");

	const { data, isLoading, error } = usePosts({ page, limit: 20, search });
	const uploadMutation = useUploadPosts();
	const deleteMutation = useDeletePost();
	const styleAnalysis = useStartStyleAnalysis();
	const topicExtraction = useStartTopicExtraction();

	const posts = data?.data ?? [];
	const pagination = data?.pagination;

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				uploadMutation.mutate(file);
				e.target.value = "";
			}
		},
		[uploadMutation],
	);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchInput);
		setPage(1);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">LinkedIn Posts</h1>
					<p className="text-muted-foreground">
						Import and manage your LinkedIn post history.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => styleAnalysis.mutate()}
						isLoading={styleAnalysis.isPending}
						disabled={!posts.length}>
						<Brain className="mr-2 h-4 w-4" />
						Analyze Style
					</Button>
					<Button
						variant="outline"
						onClick={() => topicExtraction.mutate()}
						isLoading={topicExtraction.isPending}
						disabled={!posts.length}>
						<Tags className="mr-2 h-4 w-4" />
						Extract Topics
					</Button>
				</div>
			</div>

			{/* Upload */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Import Posts</CardTitle>
					<CardDescription>
						Upload a CSV or JSON file exported from LinkedIn.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-6 py-4 transition-colors hover:bg-accent">
							<Upload className="h-5 w-5 text-muted-foreground" />
							<span className="text-sm">
								{uploadMutation.isPending
									? "Uploading..."
									: "Choose CSV or JSON file"}
							</span>
							<input
								type="file"
								accept=".csv,.json"
								className="hidden"
								onChange={handleFileUpload}
								disabled={uploadMutation.isPending}
							/>
						</label>
						{uploadMutation.isSuccess && (
							<Alert variant="success" className="flex-1">
								Successfully imported{" "}
								{uploadMutation.data?.data?.imported ?? 0} posts
								{uploadMutation.data?.data?.duplicates > 0 &&
									` (${uploadMutation.data.data.duplicates} duplicates skipped)`}
							</Alert>
						)}
						{uploadMutation.isError && (
							<Alert variant="error" className="flex-1">
								Upload failed. Please check your file format.
							</Alert>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Analysis success */}
			{styleAnalysis.isSuccess && (
				<Alert variant="success">
					Style analysis started! Check back shortly for results.
				</Alert>
			)}
			{topicExtraction.isSuccess && (
				<Alert variant="success">
					Topic extraction started! Check back shortly for results.
				</Alert>
			)}

			{/* Search */}
			<form onSubmit={handleSearch} className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search posts..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button type="submit" variant="secondary">
					Search
				</Button>
			</form>

			{/* Posts List */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : error ? (
				<Alert variant="error">Failed to load posts.</Alert>
			) : posts.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						{search
							? "No posts match your search."
							: "No posts imported yet. Upload a file to get started."}
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{posts.map((post: Record<string, unknown>) => (
						<Card key={post.id as string}>
							<CardContent className="flex items-start gap-4 p-4">
								<div className="flex-1 min-w-0">
									<p className="text-sm">
										{truncate(post.postText as string, 300)}
									</p>
									<div className="mt-2 flex flex-wrap items-center gap-2">
										<span className="text-xs text-muted-foreground">
											{formatDate(post.postedAt as string)}
										</span>
										<Badge variant="secondary">
											Score:{" "}
											{calculateEngagementScore(
												(post.likes as number) || 0,
												(post.comments as number) || 0,
												(post.shares as number) || 0,
											)}
										</Badge>
										<span className="text-xs text-muted-foreground">
											👍 {(post.likes as number) || 0} · 💬{" "}
											{(post.comments as number) || 0} · 🔄{" "}
											{(post.shares as number) || 0}
										</span>
										{((post.topics as string[]) || [])
											.slice(0, 3)
											.map((topic: string) => (
												<Badge
													key={topic}
													variant="outline"
													className="text-xs">
													{topic}
												</Badge>
											))}
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										deleteMutation.mutate(post.id as string)
									}
									disabled={deleteMutation.isPending}>
									<Trash2 className="h-4 w-4 text-muted-foreground" />
								</Button>
							</CardContent>
						</Card>
					))}

					{/* Pagination */}
					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-sm text-muted-foreground">
								Page {pagination.page} of {pagination.totalPages} (
								{pagination.total} posts)
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage((p) => p - 1)}>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= pagination.totalPages}
									onClick={() => setPage((p) => p + 1)}>
									Next
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
