"use client";

import { useEngagementAnalytics, useTopicAnalytics } from "@/hooks/use-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, TrendingUp } from "lucide-react";

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
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Analytics</h1>
				<p className="text-muted-foreground">
					Insights from your LinkedIn post performance.
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
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : engagementError ? (
						<Alert variant="error">
							Failed to load engagement data. Import posts first.
						</Alert>
					) : !engagement ? (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								No engagement data available. Import LinkedIn posts to see
								analytics.
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{/* Summary */}
							<div className="grid gap-4 sm:grid-cols-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">
											Total Posts
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{engagement.totalPosts ?? 0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">
											Avg Likes
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{Math.round(engagement.avgLikes ?? 0)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">
											Avg Comments
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{Math.round(engagement.avgComments ?? 0)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">
											Avg Engagement Score
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{Math.round(
												engagement.avgEngagementScore ?? 0,
											)}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Weekly Trends */}
							{engagement.weeklyTrends &&
								engagement.weeklyTrends.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<TrendingUp className="h-5 w-5" />
												Weekly Engagement Trend
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
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
														) => (
															<div
																key={i}
																className="flex items-center gap-3">
																<span className="w-24 text-xs text-muted-foreground">
																	{week.week}
																</span>
																<div className="flex-1">
																	<div
																		className="h-6 rounded bg-primary/20"
																		style={{
																			width: `${Math.min(
																				(week.avgScore /
																					Math.max(
																						...(
																							engagement.weeklyTrends as Array<{
																								avgScore: number;
																							}>
																						).map(
																							(w: {
																								avgScore: number;
																							}) =>
																								w.avgScore,
																						),
																						1,
																					)) *
																					100,
																				100,
																			)}%`,
																		}}>
																		<div className="px-2 text-xs leading-6">
																			{Math.round(
																				week.avgScore,
																			)}
																		</div>
																	</div>
																</div>
																<span className="text-xs text-muted-foreground">
																	{
																		week.postCount
																	}{" "}
																	posts
																</span>
															</div>
														),
													)}
											</div>
										</CardContent>
									</Card>
								)}

							{/* Best Day */}
							{engagement.dayOfWeekAnalysis && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<BarChart3 className="h-5 w-5" />
											Performance by Day of Week
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid gap-2 sm:grid-cols-7">
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
														className="rounded-lg border p-3 text-center">
														<p className="text-xs font-medium">
															{day.day}
														</p>
														<p className="mt-1 text-lg font-bold">
															{Math.round(
																day.avgScore,
															)}
														</p>
														<p className="text-xs text-muted-foreground">
															{day.postCount} posts
														</p>
													</div>
												),
											)}
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</TabsContent>

				{/* Topics Tab */}
				<TabsContent value="topics">
					{topicLoading ? (
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : topicError ? (
						<Alert variant="error">
							Failed to load topic data. Run topic extraction first.
						</Alert>
					) : !topics || (Array.isArray(topics) && topics.length === 0) ? (
						<Card>
							<CardContent className="py-12 text-center text-muted-foreground">
								No topic data available. Run topic extraction from the Posts
								page first.
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{(Array.isArray(topics) ? topics : [topics]).map(
								(
									topic: {
										name: string;
										postCount: number;
										avgEngagement: number;
									},
									i: number,
								) => (
									<Card key={i}>
										<CardContent className="flex items-center justify-between p-4">
											<div>
												<h4 className="font-medium">
													{topic.name}
												</h4>
												<p className="text-sm text-muted-foreground">
													{topic.postCount} posts
												</p>
											</div>
											<div className="text-right">
												<p className="text-lg font-bold">
													{Math.round(topic.avgEngagement)}
												</p>
												<p className="text-xs text-muted-foreground">
													avg engagement
												</p>
											</div>
										</CardContent>
									</Card>
								),
							)}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
