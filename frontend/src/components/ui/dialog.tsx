"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="fixed inset-0 bg-black/80" onClick={onClose} />
			<div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6">
				<button
					onClick={onClose}
					className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring">
					<X className="h-4 w-4" />
				</button>
				{children}
			</div>
		</div>
	);
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
			{...props}
		/>
	);
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			className={cn("text-base font-medium leading-none tracking-tight", className)}
			{...props}
		/>
	);
}

export function DialogDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
