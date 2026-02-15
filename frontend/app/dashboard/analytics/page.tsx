"use client";

import { useEngagementAnalytics, useTopicAnalytics } from "@/hooks/use-analysis";
import { Alert } from "@/components/ui/alert";
import { SkeletonList } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AnalyticsPage() {
	const {
		data: engagementData,
		isLoading: engagementLoading,
		error: engagementError,
	} = useEngagementAnalytics();
	const { data: topicData, isLoading: topicLoading, error: topicError } = useTopicAnalytics();

	const engagement = engagementData?.data;
	const topics = topicData?.data;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-lg font-semibold">Analytics</h1>
				<p className="text-sm text-muted-foreground">
					Insights from your post performance.
				</p>
			</div>

			<Tabs defaultValue="engagement">
				<TabsList>
					<TabsTrigger value="engagement">Engagement</TabsTrigger>
					<TabsTrigger value="topics">Topics</TabsTrigger>
				</TabsList>

				{/* Engagement Tab */}
				<TabsContent value="engagement">
					{engagementLoading ? (
						<SkeletonList count={3} />
					) : engagementError ? (
						<Alert variant="error">
							Failed to load engagement data. Import posts first.
						</Alert>
					) : !engagement ? (
						<div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
							No engagement data. Import posts to see analytics.
						</div>
					) : (
						<div className="space-y-6">
							{/* Summary */}
							<div className="gap-px overflow-hidden rounded-lg border bg-border grid sm:grid-cols-4">
								{[
									{
										label: "Total Posts",
										value: engagement.totalPosts ?? 0,
									},
									{
										label: "Avg Likes",
										value: Math.round(engagement.avgLikes ?? 0),
									},
									{
										label: "Avg Comments",
										value: Math.round(engagement.avgComments ?? 0),
									},
									{
										label: "Avg Score",
										value: Math.round(
											engagement.avgEngagementScore ?? 0,
										),
									},
								].map((m) => (
									<div key={m.label} className="bg-card p-4">
										<p className="text-[11px] uppercase tracking-wider text-muted-foreground">
											{m.label}
										</p>
										<p className="mt-1 text-xl font-semibold tabular-nums">
											{m.value}
										</p>
									</div>
								))}
							</div>

							{/* Weekly Trends */}
							{engagement.weeklyTrends &&
								engagement.weeklyTrends.length > 0 && (
									<div className="rounded-lg border p-5 space-y-3">
										<p className="text-sm font-medium">
											Weekly Trend
										</p>
										<div className="space-y-1.5">
											{(
												engagement.weeklyTrends as Array<{
													week: string;
													avgScore: number;
													postCount: number;
												}>
											)
												.slice(-12)
												.map(
													(
														week: {
															week: string;
															avgScore: number;
															postCount: number;
														},
														i: number,
													) => {
														const maxScore = Math.max(
															...(
																engagement.weeklyTrends as Array<{
																	avgScore: number;
																}>
															).map(
																(w: {
																	avgScore: number;
																}) => w.avgScore,
															),
															1,
														);
														return (
															<div
																key={i}
																className="flex items-center gap-3">
																<span className="w-20 text-[11px] text-muted-foreground tabular-nums">
																	{week.week}
																</span>
																<div className="flex-1 h-5 rounded bg-secondary overflow-hidden">
																	<div
																		className="h-full bg-foreground/15 flex items-center px-2"
																		style={{
																			width: `${Math.min((week.avgScore / maxScore) * 100, 100)}%`,
																		}}>
																		<span className="text-[10px] tabular-nums">
																			{Math.round(
																				week.avgScore,
																			)}
																		</span>
																	</div>
																</div>
																<span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
																	{
																		week.postCount
																	}
																	p
																</span>
															</div>
														);
													},
												)}
										</div>
									</div>
								)}

							{/* Best Day */}
							{engagement.dayOfWeekAnalysis && (
								<div className="rounded-lg border p-5 space-y-3">
									<p className="text-sm font-medium">By Day of Week</p>
									<div className="gap-px overflow-hidden rounded border bg-border grid grid-cols-7">
										{(
											engagement.dayOfWeekAnalysis as Array<{
												day: string;
												avgScore: number;
												postCount: number;
											}>
										).map(
											(
												day: {
													day: string;
													avgScore: number;
													postCount: number;
												},
												i: number,
											) => (
												<div
													key={i}
													className="bg-card p-3 text-center">
													<p className="text-[11px] text-muted-foreground">
														{day.day}
													</p>
													<p className="mt-0.5 text-sm font-semibold tabular-nums">
														{Math.round(day.avgScore)}
													</p>
													<p className="text-[10px] text-muted-foreground tabular-nums">
														{day.postCount}p
													</p>
												</div>
											),
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</TabsContent>

				{/* Topics Tab */}
				<TabsContent value="topics">
					{topicLoading ? (
						<SkeletonList count={3} />
					) : topicError ? (
						<Alert variant="error">
							Failed to load topic data. Run topic extraction first.
						</Alert>
					) : !topics || (Array.isArray(topics) && topics.length === 0) ? (
						<div className="rounded-lg border py-16 text-center text-sm text-muted-foreground">
							No topic data. Run topic extraction from the Posts page first.
						</div>
					) : (
						<div className="space-y-px overflow-hidden rounded-lg border bg-border">
							{(Array.isArray(topics) ? topics : [topics]).map(
								(
									topic: {
										name: string;
										postCount: number;
										avgEngagement: number;
									},
									i: number,
								) => (
									<div
										key={i}
										className="bg-card flex items-center justify-between p-4">
										<div>
											<p className="text-sm font-medium">
												{topic.name}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{topic.postCount} posts
											</p>
										</div>
										<div className="text-right">
											<p className="text-sm font-semibold tabular-nums">
												{Math.round(topic.avgEngagement)}
											</p>
											<p className="text-[10px] text-muted-foreground">
												avg score
											</p>
										</div>
									</div>
								),
							)}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
