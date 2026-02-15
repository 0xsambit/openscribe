"use client";

import { useState } from "react";
import { useCurrentStrategy, useGenerateStrategy } from "@/hooks/use-strategy";
import { useJobPolling } from "@/hooks/use-job-polling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ThinkingCard } from "@/components/ui/thinking-card";
import { SkeletonList } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

const strategyTypes = [
	{ value: "weekly", label: "Weekly (7 days)" },
	{ value: "monthly", label: "Monthly (30 days)" },
	{ value: "campaign", label: "Campaign (Goal-driven)" },
];

const goalTypes = [
	{ value: "thought_leadership", label: "Thought Leadership" },
	{ value: "lead_generation", label: "Lead Generation" },
	{ value: "community_building", label: "Community Building" },
	{ value: "brand_awareness", label: "Brand Awareness" },
];

export default function StrategyPage() {
	const { data: strategyData, isLoading: strategyLoading } = useCurrentStrategy();
	const generateMutation = useGenerateStrategy();

	const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
	const [jobId, setJobId] = useState<string | null>(null);

	const job = useJobPolling(jobId, {
		invalidateKeys: [["strategy", "current"], ["strategy"], ["strategies"]],
		onComplete: () => setActiveTab("current"),
	});

	const [strategyType, setStrategyType] = useState<"weekly" | "monthly" | "campaign">("weekly");
	const [postingFrequency, setPostingFrequency] = useState("3");
	const [audienceDescription, setAudienceDescription] = useState("");
	const [audienceIndustries, setAudienceIndustries] = useState("");
	const [audienceRoles, setAudienceRoles] = useState("");
	const [primaryGoal, setPrimaryGoal] = useState<
		"thought_leadership" | "lead_generation" | "community_building" | "brand_awareness"
	>("thought_leadership");
	const [kpis, setKpis] = useState("");

	const strategy = strategyData?.data;

	const handleGenerate = async () => {
		try {
			const result = await generateMutation.mutateAsync({
				strategyType,
				postingFrequency: parseInt(postingFrequency),
				targetAudience: {
					description: audienceDescription,
					industries: audienceIndustries
						? audienceIndustries
								.split(",")
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
					roles: audienceRoles
						? audienceRoles
								.split(",")
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
					interests: [],
				},
				goals: {
					primary: primaryGoal,
					secondary: [],
					kpis: kpis
						? kpis
								.split(",")
								.map((s) => s.trim())
								.filter(Boolean)
						: [],
				},
			});
			const id = result?.data?.jobId;
			if (id) setJobId(id);
		} catch {
			// mutation error handled by generateMutation.isError
		}
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-lg font-semibold">Strategy</h1>
				<p className="text-sm text-muted-foreground">
					AI-powered content strategies from your LinkedIn data.
				</p>
			</div>

			<Tabs
				value={activeTab}
				defaultValue={strategy ? "current" : "generate"}
				onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="current">Current</TabsTrigger>
					<TabsTrigger value="generate">Generate</TabsTrigger>
				</TabsList>

				<TabsContent value="current">
					{strategyLoading ? (
						<SkeletonList count={2} />
					) : !strategy ? (
						<div className="rounded-lg border py-16 text-center">
							<p className="text-sm text-muted-foreground">
								No active strategy. Generate one to get started.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{/* Meta */}
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Badge variant="secondary">{strategy.strategyType}</Badge>
								<span>&middot;</span>
								<span>{formatDate(strategy.createdAt)}</span>
								{strategy.expiresAt && (
									<>
										<span>&middot;</span>
										<span>
											Expires {formatDate(strategy.expiresAt)}
										</span>
									</>
								)}
							</div>

							{/* Themes */}
							{strategy.themes && (
								<div>
									<p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Themes
									</p>
									<div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
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
												<div key={i} className="bg-card p-4">
													<p className="text-sm font-medium">
														{theme.name}
													</p>
													<p className="mt-1 text-xs text-muted-foreground">
														{theme.description}
													</p>
													{theme.frequency && (
														<Badge
															variant="outline"
															className="mt-2 text-[10px]">
															{theme.frequency}
														</Badge>
													)}
												</div>
											),
										)}
									</div>
								</div>
							)}

							{/* Audience */}
							{strategy.targetAudience && (
								<div>
									<p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Target Audience
									</p>
									<p className="text-sm text-muted-foreground">
										{typeof strategy.targetAudience === "object"
											? (
													strategy.targetAudience as {
														description?: string;
													}
												).description ||
												JSON.stringify(strategy.targetAudience)
											: String(strategy.targetAudience)}
									</p>
								</div>
							)}

							{/* Goals */}
							{strategy.goals && (
								<div>
									<p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Goals
									</p>
									<p className="text-sm text-muted-foreground">
										{typeof strategy.goals === "object"
											? `Primary: ${(strategy.goals as { primary?: string }).primary || "N/A"}`
											: String(strategy.goals)}
									</p>
								</div>
							)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="generate">
					<div className="space-y-5">
						{(generateMutation.isSuccess ||
							job.isThinking ||
							job.phase === "completed") && (
							<ThinkingCard
								phase={job.phase}
								label="Generating strategy..."
								progress={job.progress}
								error={job.error}
							/>
						)}
						{generateMutation.isError && (
							<Alert variant="error">
								Failed. Ensure posts are imported and an AI provider is
								configured.
							</Alert>
						)}

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label className="text-xs">Strategy Type</Label>
								<Select
									options={strategyTypes}
									value={strategyType}
									onChange={(e) =>
										setStrategyType(
											e.target.value as
												| "weekly"
												| "monthly"
												| "campaign",
										)
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Posts Per Week</Label>
								<Input
									type="number"
									min="1"
									max="14"
									value={postingFrequency}
									onChange={(e) => setPostingFrequency(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Primary Goal</Label>
							<Select
								options={goalTypes}
								value={primaryGoal}
								onChange={(e) =>
									setPrimaryGoal(
										e.target.value as
											| "thought_leadership"
											| "lead_generation"
											| "community_building"
											| "brand_awareness",
									)
								}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">
								Target Audience <span className="text-destructive">*</span>
							</Label>
							<Input
								placeholder="e.g., SaaS founders looking to grow their personal brand"
								value={audienceDescription}
								onChange={(e) => setAudienceDescription(e.target.value)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<Label className="text-xs">
									Industries (comma-separated)
								</Label>
								<Input
									placeholder="e.g., SaaS, FinTech"
									value={audienceIndustries}
									onChange={(e) => setAudienceIndustries(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">
									Target Roles (comma-separated)
								</Label>
								<Input
									placeholder="e.g., CTO, VP Engineering"
									value={audienceRoles}
									onChange={(e) => setAudienceRoles(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">KPIs (comma-separated)</Label>
							<Input
								placeholder="e.g., 500 new followers, 10% engagement rate"
								value={kpis}
								onChange={(e) => setKpis(e.target.value)}
							/>
						</div>

						<Button
							onClick={handleGenerate}
							isLoading={generateMutation.isPending}
							disabled={!audienceDescription.trim()}
							className="w-full">
							Generate Strategy
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
