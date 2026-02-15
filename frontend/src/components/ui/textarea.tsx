import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, error, ...props }, ref) => {
		return (
			<div className="w-full">
				<textarea
					className={cn(
						"flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						error && "border-destructive focus-visible:ring-destructive",
						className,
					)}
					ref={ref}
					{...props}
				/>
				{error && <p className="mt-1 text-xs text-destructive">{error}</p>}
			</div>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea };
