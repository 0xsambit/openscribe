import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("animate-pulse rounded-md bg-muted/50", className)} {...props} />;
}

function SkeletonCard({ className }: { className?: string }) {
	return (
		<div className={cn("rounded-lg border p-4 space-y-3", className)}>
			<div className="flex items-center gap-3">
				<Skeleton className="h-8 w-8 rounded-md" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-3 w-1/3" />
					<Skeleton className="h-2.5 w-1/2" />
				</div>
			</div>
			<Skeleton className="h-2.5 w-full" />
			<Skeleton className="h-2.5 w-4/5" />
		</div>
	);
}

function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
	return (
		<div className={cn("space-y-3", className)}>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonCard key={i} />
			))}
		</div>
	);
}

export { Skeleton, SkeletonCard, SkeletonList };
