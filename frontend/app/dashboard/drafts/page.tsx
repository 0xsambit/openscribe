"use client";

import { useState } from "react";
import {
	useDrafts,
	useGenerateContent,
	useUpdateDraft,
	useSubmitFeedback,
	useDeleteDraft,
} from "@/hooks/use-drafts";
import { useJobPolling } from "@/hooks/use-job-polling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ThinkingCard } from "@/components/ui/thinking-card";
import { SkeletonList } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Star, Trash2, Edit } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";

const statusColors: Record<
	string,
	"default" | "secondary" | "success" | "warning" | "destructive"
> = {
	draft: "secondary",
	approved: "success",
	rejected: "destructive",
	published: "default",
};

export default function DraftsPage() {
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState("");
	const [selectedDraft, setSelectedDraft] = useState<Record<string, unknown> | null>(null);
	const [editContent, setEditContent] = useState("");
	const [feedbackRating, setFeedbackRating] = useState(0);
	const [feedbackText, setFeedbackText] = useState("");
	const [generateTopic, setGenerateTopic] = useState("");
	const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
	const [genJobId, setGenJobId] = useState<string | null>(null);

	const { data, isLoading } = useDrafts({ page, limit: 20, status: statusFilter || undefined });
	const generateMutation = useGenerateContent();
	const updateMutation = useUpdateDraft();
	const feedbackMutation = useSubmitFeedback();
	const deleteMutation = useDeleteDraft();

	const genJob = useJobPolling(genJobId, {
		invalidateKeys: [["drafts"]],
		onComplete: () => setActiveTab("drafts"),
	});

	const drafts = data?.data ?? [];
	const pagination = data?.pagination;

	const handleGenerate = async () => {
		if (!generateTopic.trim()) return;
		try {
			const result = await generateMutation.mutateAsync({ topic: generateTopic });
			const id = result?.data?.jobId;
			if (id) setGenJobId(id);
			setGenerateTopic("");
		} catch {
			// handled by generateMutation.isError
		}
	};

	const handleSaveEdit = () => {
		if (selectedDraft) {
			updateMutation.mutate(
				{ id: selectedDraft.id as string, postText: editContent },
				{ onSuccess: () => setSelectedDraft(null) },
			);
		}
	};

	const handleSubmitFeedback = (draftId: string) => {
		feedbackMutation.mutate(
			{ id: draftId, rating: feedbackRating, feedback: feedbackText || undefined },
			{
				onSuccess: () => {
					setFeedbackRating(0);
					setFeedbackText("");
				},
			},
		);
	};

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-lg font-semibold">Drafts</h1>
				<p className="text-sm text-muted-foreground">
					Generate, review, and refine post drafts.
				</p>
			</div>

			<Tabs value={activeTab} defaultValue="drafts" onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="drafts">Drafts</TabsTrigger>
					<TabsTrigger value="generate">Generate</TabsTrigger>
				</TabsList>

				{/* Generate Tab */}
				<TabsContent value="generate">
					<div className="rounded-lg border p-5 space-y-4">
						<div>
							<p className="text-sm font-medium">Generate Content</p>
							<p className="text-xs text-muted-foreground mt-1">
								Create a new post draft using AI.
							</p>
						</div>
						{(genJob.isThinking || genJob.phase === "completed") && (
							<ThinkingCard
								phase={genJob.phase}
								label="Generating content draft..."
								progress={genJob.progress}
								error={genJob.error}
							/>
						)}
						{generateMutation.isError && (
							<Alert variant="error">
								Generation failed. Ensure you have an AI provider configured
								and posts imported.
							</Alert>
						)}
						<div className="space-y-1.5">
							<Label className="text-xs">
								Topic <span className="text-destructive">*</span>
							</Label>
							<Input
								placeholder="e.g., AI productivity tips, leadership lessons"
								value={generateTopic}
								onChange={(e) => setGenerateTopic(e.target.value)}
							/>
						</div>
						<Button
							size="sm"
							onClick={handleGenerate}
							isLoading={generateMutation.isPending}
							disabled={!generateTopic.trim()}>
							Generate Draft
						</Button>
					</div>
				</TabsContent>

				{/* Drafts Tab */}
				<TabsContent value="drafts">
					{/* Filters */}
					<div className="mb-4 flex gap-1.5">
						{["", "draft", "approved", "rejected"].map((status) => (
							<Button
								key={status}
								variant={statusFilter === status ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setStatusFilter(status);
									setPage(1);
								}}>
								{status || "All"}
							</Button>
						))}
					</div>

					{isLoading ? (
						<SkeletonList count={3} />
					) : drafts.length === 0 ? (
						<div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
							No drafts yet. Generate your first content draft.
						</div>
					) : (
						<div className="space-y-px overflow-hidden rounded-lg border bg-border">
							{drafts.map((draft: Record<string, unknown>) => (
								<div key={draft.id as string} className="bg-card p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="mb-2 flex items-center gap-2">
												<Badge
													variant={
														statusColors[
															(draft.status as string) ||
																"draft"
														]
													}>
													{(draft.status as string) ||
														"draft"}
												</Badge>
												<span className="text-[11px] text-muted-foreground">
													{formatDate(
														draft.createdAt as string,
													)}
												</span>
											</div>
											<p className="whitespace-pre-wrap text-sm leading-relaxed">
												{truncate(
													draft.postText as string,
													400,
												)}
											</p>
										</div>
										<div className="flex shrink-0 gap-0.5">
											<button
												onClick={() =>
													copyToClipboard(
														draft.postText as string,
													)
												}
												className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
												title="Copy">
												<Copy className="h-3.5 w-3.5" />
											</button>
											<button
												onClick={() => {
													setSelectedDraft(draft);
													setEditContent(
														draft.postText as string,
													);
												}}
												className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
												title="Edit">
												<Edit className="h-3.5 w-3.5" />
											</button>
											<button
												onClick={() =>
													deleteMutation.mutate(
														draft.id as string,
													)
												}
												className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
												title="Delete">
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</div>
									</div>

									{/* Feedback */}
									{(draft.status as string) === "draft" && (
										<div className="mt-3 border-t pt-3">
											<p className="mb-1.5 text-xs text-muted-foreground">
												Rate this draft
											</p>
											<div className="flex items-center gap-3">
												<div className="flex gap-0.5">
													{[1, 2, 3, 4, 5].map((star) => (
														<button
															key={star}
															onClick={() =>
																setFeedbackRating(
																	star,
																)
															}
															className={
																feedbackRating >=
																star
																	? "text-foreground"
																	: "text-muted-foreground/40"
															}>
															<Star
																className="h-4 w-4"
																fill={
																	feedbackRating >=
																	star
																		? "currentColor"
																		: "none"
																}
															/>
														</button>
													))}
												</div>
												<Input
													placeholder="Optional feedback..."
													value={feedbackText}
													onChange={(e) =>
														setFeedbackText(
															e.target.value,
														)
													}
													className="flex-1"
												/>
												<Button
													size="sm"
													variant="outline"
													disabled={feedbackRating === 0}
													isLoading={
														feedbackMutation.isPending
													}
													onClick={() =>
														handleSubmitFeedback(
															draft.id as string,
														)
													}>
													Submit
												</Button>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Pagination */}
					{pagination && pagination.totalPages > 1 && (
						<div className="mt-4 flex items-center justify-between">
							<p className="text-xs text-muted-foreground">
								Page {pagination.page} of {pagination.totalPages}
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
				</TabsContent>
			</Tabs>

			{/* Edit Dialog */}
			<Dialog open={!!selectedDraft} onClose={() => setSelectedDraft(null)}>
				<DialogHeader>
					<DialogTitle>Edit Draft</DialogTitle>
				</DialogHeader>
				<div className="mt-4 space-y-4">
					<Textarea
						value={editContent}
						onChange={(e) => setEditContent(e.target.value)}
						rows={12}
						className="font-mono text-sm"
					/>
					<div className="flex justify-end gap-1.5">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedDraft(null)}>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveEdit}
							isLoading={updateMutation.isPending}>
							Save
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
}
