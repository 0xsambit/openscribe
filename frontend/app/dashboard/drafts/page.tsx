"use client";

import { useState } from "react";
import {
	useDrafts,
	useGenerateContent,
	useUpdateDraft,
	useSubmitFeedback,
	useDeleteDraft,
} from "@/hooks/use-drafts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PenTool, Sparkles, Copy, Star, Trash2, Edit } from "lucide-react";
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
	const [generateTone, setGenerateTone] = useState("");

	const { data, isLoading } = useDrafts({ page, limit: 20, status: statusFilter || undefined });
	const generateMutation = useGenerateContent();
	const updateMutation = useUpdateDraft();
	const feedbackMutation = useSubmitFeedback();
	const deleteMutation = useDeleteDraft();

	const drafts = data?.data ?? [];
	const pagination = data?.pagination;

	const handleGenerate = () => {
		generateMutation.mutate({
			topic: generateTopic || undefined,
			tone: generateTone || undefined,
		});
		setGenerateTopic("");
		setGenerateTone("");
	};

	const handleSaveEdit = () => {
		if (selectedDraft) {
			updateMutation.mutate(
				{ id: selectedDraft.id as string, content: editContent },
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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Content Drafts</h1>
					<p className="text-muted-foreground">
						Generate, review, and refine LinkedIn post drafts.
					</p>
				</div>
			</div>

			<Tabs defaultValue="drafts">
				<TabsList>
					<TabsTrigger value="drafts">My Drafts</TabsTrigger>
					<TabsTrigger value="generate">Generate New</TabsTrigger>
				</TabsList>

				{/* Generate Tab */}
				<TabsContent value="generate">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="h-5 w-5" />
								Generate Content
							</CardTitle>
							<CardDescription>
								Create a new LinkedIn post draft using AI. Optionally
								specify a topic or tone.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{generateMutation.isSuccess && (
								<Alert variant="success">
									Content generation started! Your draft will appear in
									the Drafts tab.
								</Alert>
							)}
							{generateMutation.isError && (
								<Alert variant="error">
									Generation failed. Ensure you have an AI provider
									configured and posts imported.
								</Alert>
							)}
							<div className="space-y-2">
								<Label>Topic (optional)</Label>
								<Input
									placeholder="e.g., AI productivity tips, leadership lessons"
									value={generateTopic}
									onChange={(e) => setGenerateTopic(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>Tone (optional)</Label>
								<Input
									placeholder="e.g., professional, casual, inspirational"
									value={generateTone}
									onChange={(e) => setGenerateTone(e.target.value)}
								/>
							</div>
							<Button
								onClick={handleGenerate}
								isLoading={generateMutation.isPending}>
								<PenTool className="mr-2 h-4 w-4" />
								Generate Draft
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Drafts Tab */}
				<TabsContent value="drafts">
					{/* Filters */}
					<div className="mb-4 flex gap-2">
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
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : drafts.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								No drafts yet. Generate your first content draft!
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{drafts.map((draft: Record<string, unknown>) => (
								<Card key={draft.id as string}>
									<CardContent className="p-4">
										<div className="flex items-start justify-between gap-4">
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
													<span className="text-xs text-muted-foreground">
														{formatDate(
															draft.createdAt as string,
														)}
													</span>
												</div>
												<p className="whitespace-pre-wrap text-sm">
													{truncate(
														draft.content as string,
														500,
													)}
												</p>
											</div>
											<div className="flex shrink-0 gap-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														copyToClipboard(
															draft.content as string,
														)
													}
													title="Copy">
													<Copy className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setSelectedDraft(draft);
														setEditContent(
															draft.content as string,
														);
													}}
													title="Edit">
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														deleteMutation.mutate(
															draft.id as string,
														)
													}
													title="Delete">
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										{/* Feedback */}
										{(draft.status as string) === "draft" && (
											<div className="mt-4 border-t pt-4">
												<p className="mb-2 text-sm font-medium">
													Rate this draft:
												</p>
												<div className="flex items-center gap-4">
													<div className="flex gap-1">
														{[1, 2, 3, 4, 5].map(
															(star) => (
																<button
																	key={star}
																	onClick={() =>
																		setFeedbackRating(
																			star,
																		)
																	}
																	className={`${
																		feedbackRating >=
																		star
																			? "text-yellow-500"
																			: "text-muted-foreground"
																	}`}>
																	<Star
																		className="h-5 w-5"
																		fill={
																			feedbackRating >=
																			star
																				? "currentColor"
																				: "none"
																		}
																	/>
																</button>
															),
														)}
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
														disabled={
															feedbackRating === 0
														}
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
									</CardContent>
								</Card>
							))}

							{/* Pagination */}
							{pagination && pagination.totalPages > 1 && (
								<div className="flex items-center justify-between pt-4">
									<p className="text-sm text-muted-foreground">
										Page {pagination.page} of {pagination.totalPages}
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
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setSelectedDraft(null)}>
							Cancel
						</Button>
						<Button onClick={handleSaveEdit} isLoading={updateMutation.isPending}>
							Save Changes
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
}
