import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export function Spinner({ size = "md", className }: SpinnerProps) {
	return (
		<Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size], className)} />
	);
}

export function PageLoader() {
	return (
		<div className="flex h-[50vh] items-center justify-center">
			<Spinner size="lg" />
		</div>
	);
}
