"use client";

import { useState } from "react";
import { useCurrentStrategy, useGenerateStrategy } from "@/hooks/use-strategy";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, Calendar, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

const strategyTypes = [
	{ value: "growth", label: "Growth (Maximize reach & followers)" },
	{ value: "engagement", label: "Engagement (Maximize interactions)" },
	{ value: "thought_leadership", label: "Thought Leadership (Build authority)" },
	{ value: "balanced", label: "Balanced (Mix of all goals)" },
];

export default function StrategyPage() {
	const { data: strategyData, isLoading: strategyLoading } = useCurrentStrategy();
	const generateMutation = useGenerateStrategy();

	const [strategyType, setStrategyType] = useState("balanced");
	const [postingFrequency, setPostingFrequency] = useState("3");
	const [targetAudience, setTargetAudience] = useState("");
	const [goals, setGoals] = useState("");

	const strategy = strategyData?.data;

	const handleGenerate = () => {
		generateMutation.mutate({
			strategyType,
			postingFrequency: parseInt(postingFrequency),
			targetAudience: targetAudience || undefined,
			goals: goals || undefined,
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Content Strategy</h1>
				<p className="text-muted-foreground">
					Generate AI-powered content strategies based on your LinkedIn data.
				</p>
			</div>

			<Tabs defaultValue={strategy ? "current" : "generate"}>
				<TabsList>
					<TabsTrigger value="current">Current Strategy</TabsTrigger>
					<TabsTrigger value="generate">Generate New</TabsTrigger>
				</TabsList>

				{/* Current Strategy */}
				<TabsContent value="current">
					{strategyLoading ? (
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					) : !strategy ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Target className="mx-auto h-12 w-12 text-muted-foreground" />
								<h3 className="mt-4 text-lg font-semibold">
									No Active Strategy
								</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Generate a new content strategy to get personalized
									recommendations.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle>Active Strategy</CardTitle>
											<CardDescription>
												Type:{" "}
												<Badge variant="secondary">
													{strategy.strategyType}
												</Badge>
												{" · "}Created:{" "}
												{formatDate(strategy.createdAt)}
												{strategy.expiresAt &&
													` · Expires: ${formatDate(strategy.expiresAt)}`}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									{/* Themes */}
									{strategy.themes && (
										<div className="mb-6">
											<h4 className="mb-3 font-semibold">
												Content Themes
											</h4>
											<div className="grid gap-3 sm:grid-cols-2">
												{(
													strategy.themes as Array<{
														name: string;
														description: string;
														frequency: string;
													}>
												).map(
													(
														theme: {
															name: string;
															description: string;
															frequency: string;
														},
														i: number,
													) => (
														<Card key={i}>
															<CardContent className="p-4">
																<h5 className="font-medium">
																	{theme.name}
																</h5>
																<p className="mt-1 text-sm text-muted-foreground">
																	{
																		theme.description
																	}
																</p>
																{theme.frequency && (
																	<Badge
																		variant="outline"
																		className="mt-2">
																		{
																			theme.frequency
																		}
																	</Badge>
																)}
															</CardContent>
														</Card>
													),
												)}
											</div>
										</div>
									)}

									{/* Target Audience */}
									{strategy.targetAudience && (
										<div className="mb-6">
											<h4 className="mb-2 font-semibold">
												Target Audience
											</h4>
											<p className="text-sm text-muted-foreground">
												{typeof strategy.targetAudience ===
												"string"
													? strategy.targetAudience
													: JSON.stringify(
															strategy.targetAudience,
														)}
											</p>
										</div>
									)}

									{/* Goals */}
									{strategy.goals && (
										<div>
											<h4 className="mb-2 font-semibold">Goals</h4>
											<p className="text-sm text-muted-foreground">
												{typeof strategy.goals === "string"
													? strategy.goals
													: JSON.stringify(strategy.goals)}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					)}
				</TabsContent>

				{/* Generate New */}
				<TabsContent value="generate">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="h-5 w-5" />
								Generate Strategy
							</CardTitle>
							<CardDescription>
								Configure your strategy parameters. Make sure you&apos;ve
								imported posts and run style analysis first.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{generateMutation.isSuccess && (
								<Alert variant="success">
									Strategy generation started! It will appear under
									&quot;Current Strategy&quot; once complete.
								</Alert>
							)}
							{generateMutation.isError && (
								<Alert variant="error">
									Strategy generation failed. Make sure you have posts
									imported and an AI provider configured.
								</Alert>
							)}

							<div className="space-y-2">
								<Label>Strategy Type</Label>
								<Select
									options={strategyTypes}
									value={strategyType}
									onChange={(e) => setStrategyType(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Posts Per Week</Label>
								<Input
									type="number"
									min="1"
									max="14"
									value={postingFrequency}
									onChange={(e) => setPostingFrequency(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Target Audience (optional)</Label>
								<Input
									placeholder="e.g., SaaS founders, tech professionals, marketers"
									value={targetAudience}
									onChange={(e) => setTargetAudience(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Goals (optional)</Label>
								<Textarea
									placeholder="What do you want to achieve? e.g., Build thought leadership in AI, Grow to 10k followers"
									value={goals}
									onChange={(e) => setGoals(e.target.value)}
									rows={3}
								/>
							</div>

							<Button
								onClick={handleGenerate}
								isLoading={generateMutation.isPending}
								className="w-full">
								<Calendar className="mr-2 h-4 w-4" />
								Generate Strategy
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
