"use client";

import { cn } from "@/lib/utils";
import { Brain, Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "./progress";
import type { JobPhase } from "@/hooks/use-job-polling";

interface ThinkingCardProps {
	phase: JobPhase;
	label: string;
	progress?: number;
	error?: string | null;
	className?: string;
}

const phaseConfig: Record<
	JobPhase,
	{ icon: typeof Brain; iconClass: string; bgClass: string; borderClass: string }
> = {
	idle: {
		icon: Loader2,
		iconClass: "text-muted-foreground",
		bgClass: "bg-secondary/50",
		borderClass: "border-border",
	},
	queued: {
		icon: Loader2,
		iconClass: "text-muted-foreground animate-spin",
		bgClass: "bg-secondary/50",
		borderClass: "border-border",
	},
	thinking: {
		icon: Brain,
		iconClass: "text-foreground animate-pulse",
		bgClass: "bg-secondary/50",
		borderClass: "border-foreground/10",
	},
	completed: {
		icon: CheckCircle2,
		iconClass: "text-foreground",
		bgClass: "bg-secondary/50",
		borderClass: "border-foreground/10",
	},
	failed: {
		icon: XCircle,
		iconClass: "text-destructive",
		bgClass: "bg-secondary/50",
		borderClass: "border-destructive/20",
	},
};

function ThinkingDots() {
	return (
		<span className="inline-flex items-center gap-0.5 ml-1">
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					className="inline-block h-1 w-1 rounded-full bg-foreground"
					style={{
						animation: "thinking-dot 1.4s infinite ease-in-out both",
						animationDelay: `${i * 0.16}s`,
					}}
				/>
			))}
		</span>
	);
}

export function ThinkingCard({ phase, label, progress = 0, error, className }: ThinkingCardProps) {
	if (phase === "idle") return null;

	const config = phaseConfig[phase];
	const Icon = config.icon;

	const statusText =
		phase === "queued"
			? "Queued — waiting to start"
			: phase === "thinking"
				? "AI is thinking"
				: phase === "completed"
					? "Complete!"
					: error || "Something went wrong";

	return (
		<div
			className={cn(
				"rounded-lg border p-4 transition-all duration-300",
				config.bgClass,
				config.borderClass,
				className,
			)}>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-lg",
						phase === "thinking" ? "bg-primary/10" : "bg-muted/50",
					)}>
					<Icon className={cn("h-5 w-5", config.iconClass)} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">{label}</p>
						{phase === "thinking" && (
							<Sparkles className="h-3.5 w-3.5 text-primary/60 animate-pulse" />
						)}
					</div>
					<p className="text-xs text-muted-foreground flex items-center">
						{statusText}
						{phase === "thinking" && <ThinkingDots />}
					</p>
				</div>
				{phase === "thinking" && progress > 0 && progress < 100 && (
					<span className="text-xs font-mono text-muted-foreground">
						{Math.round(progress)}%
					</span>
				)}
			</div>

			{phase === "thinking" && progress > 0 && progress < 100 && (
				<div className="mt-3">
					<Progress value={progress} className="h-1.5" />
				</div>
			)}
		</div>
	);
}
