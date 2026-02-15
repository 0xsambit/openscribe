"use client";

import { useState, useCallback } from "react";
import { usePosts, useUploadPosts, useDeletePost } from "@/hooks/use-posts";
import { useStartStyleAnalysis, useStartTopicExtraction } from "@/hooks/use-analysis";
import { useJobPolling } from "@/hooks/use-job-polling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ThinkingCard } from "@/components/ui/thinking-card";
import { SkeletonList } from "@/components/ui/skeleton";
import { Upload, Search, Trash2 } from "lucide-react";
import { formatDate, truncate, calculateEngagementScore } from "@/lib/utils";

export default function PostsPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [styleJobId, setStyleJobId] = useState<string | null>(null);
	const [topicJobId, setTopicJobId] = useState<string | null>(null);

	const { data, isLoading, error } = usePosts({ page, limit: 20, search });
	const uploadMutation = useUploadPosts();
	const deleteMutation = useDeletePost();
	const styleAnalysis = useStartStyleAnalysis();
	const topicExtraction = useStartTopicExtraction();

	const styleJob = useJobPolling(styleJobId, {
		invalidateKeys: [["posts"], ["analytics", "engagement"]],
	});
	const topicJob = useJobPolling(topicJobId, {
		invalidateKeys: [["posts"], ["analytics", "topics"]],
	});

	const posts = data?.data ?? [];
	const pagination = data?.pagination;

	const handleStyleAnalysis = async () => {
		try {
			const result = await styleAnalysis.mutateAsync();
			const id = result?.data?.jobId;
			if (id) setStyleJobId(id);
		} catch {
			// handled by styleAnalysis.isError
		}
	};

	const handleTopicExtraction = async () => {
		try {
			const result = await topicExtraction.mutateAsync();
			const id = result?.data?.jobId;
			if (id) setTopicJobId(id);
		} catch {
			// handled by topicExtraction.isError
		}
	};

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
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-semibold">Posts</h1>
					<p className="text-sm text-muted-foreground">
						Import and manage your LinkedIn history.
					</p>
				</div>
				<div className="flex gap-1.5">
					<Button
						variant="outline"
						size="sm"
						onClick={handleStyleAnalysis}
						isLoading={styleAnalysis.isPending}
						disabled={!posts.length || styleJob.isThinking}>
						Analyze Style
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleTopicExtraction}
						isLoading={topicExtraction.isPending}
						disabled={!posts.length || topicJob.isThinking}>
						Extract Topics
					</Button>
				</div>
			</div>

			{/* Upload */}
			<div className="rounded-lg border p-5 space-y-3">
				<p className="text-sm font-medium">Import</p>
				<p className="text-xs text-muted-foreground">
					CSV or JSON with columns: postText, likesCount, commentsCount, sharesCount,
					postedAt
				</p>
				{uploadMutation.isSuccess && (
					<Alert variant="success">
						Imported {uploadMutation.data?.data?.totalImported ?? 0} posts
						{uploadMutation.data?.data?.duplicatesSkipped > 0 &&
							` (${uploadMutation.data.data.duplicatesSkipped} duplicates skipped)`}
					</Alert>
				)}
				{uploadMutation.isError && (
					<Alert variant="error">
						Upload failed:{" "}
						{(uploadMutation.error as any)?.response?.data?.error?.message ||
							"Check file format"}
					</Alert>
				)}
				<label
					htmlFor="file-upload"
					className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-6 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
					<Upload className="h-4 w-4" />
					{uploadMutation.isPending ? "Uploading..." : "Click to upload"}
					<input
						id="file-upload"
						type="file"
						accept=".csv,.json"
						className="hidden"
						onChange={handleFileUpload}
						disabled={uploadMutation.isPending}
					/>
				</label>
			</div>

			{/* Job status */}
			{(styleJob.isThinking ||
				styleJob.phase === "completed" ||
				styleJob.phase === "failed") && (
				<ThinkingCard
					phase={styleJob.phase}
					label="Analyzing writing style..."
					progress={styleJob.progress}
					error={styleJob.error}
				/>
			)}
			{(topicJob.isThinking ||
				topicJob.phase === "completed" ||
				topicJob.phase === "failed") && (
				<ThinkingCard
					phase={topicJob.phase}
					label="Extracting topics..."
					progress={topicJob.progress}
					error={topicJob.error}
				/>
			)}

			{/* Search */}
			<form onSubmit={handleSearch} className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search posts..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button type="submit" variant="secondary" size="sm">
					Search
				</Button>
			</form>

			{/* Posts */}
			{isLoading ? (
				<SkeletonList count={3} />
			) : error ? (
				<Alert variant="error">Failed to load posts.</Alert>
			) : posts.length === 0 ? (
				<div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
					{search
						? "No posts match your search."
						: "No posts yet. Upload a file to start."}
				</div>
			) : (
				<div className="space-y-px overflow-hidden rounded-lg border bg-border">
					{posts.map((post: Record<string, unknown>) => (
						<div
							key={post.id as string}
							className="bg-card p-4 flex items-start gap-3">
							<div className="flex-1 min-w-0">
								<p className="text-sm leading-relaxed">
									{truncate(post.postText as string, 280)}
								</p>
								<div className="mt-2 flex flex-wrap items-center gap-1.5">
									<span className="text-[11px] text-muted-foreground">
										{formatDate(post.postedAt as string)}
									</span>
									<span className="text-[11px] text-muted-foreground">
										&middot; Score{" "}
										{calculateEngagementScore(
											(post.likesCount as number) || 0,
											(post.commentsCount as number) || 0,
											(post.sharesCount as number) || 0,
										)}
									</span>
									<span className="text-[11px] text-muted-foreground">
										&middot; {(post.likesCount as number) || 0}L
										&middot; {(post.commentsCount as number) || 0}C
										&middot; {(post.sharesCount as number) || 0}S
									</span>
									{((post.topics as string[]) || [])
										.slice(0, 3)
										.map((topic: string) => (
											<Badge
												key={topic}
												variant="outline"
												className="text-[10px] py-0 px-1.5">
												{topic}
											</Badge>
										))}
								</div>
							</div>
							<button
								onClick={() => deleteMutation.mutate(post.id as string)}
								disabled={deleteMutation.isPending}
								className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground">
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
						posts)
					</p>
					<div className="flex gap-1.5">
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
	);
}
