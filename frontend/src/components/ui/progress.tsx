import { cn } from "@/lib/utils";

interface ProgressProps {
	value: number;
	max?: number;
	className?: string;
	indicatorClassName?: string;
}

export function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

	return (
		<div
			className={cn(
				"relative h-4 w-full overflow-hidden rounded-full bg-secondary",
				className,
			)}>
			<div
				className={cn(
					"h-full rounded-full bg-primary transition-all",
					indicatorClassName,
				)}
				style={{ width: `${percentage}%` }}
			/>
		</div>
	);
}
