"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const variants = {
	default: {
		icon: Info,
		className: "bg-secondary text-foreground border-border",
	},
	success: {
		icon: CheckCircle2,
		className: "bg-secondary text-foreground border-border",
	},
	warning: {
		icon: AlertCircle,
		className: "bg-secondary text-foreground border-border",
	},
	error: {
		icon: XCircle,
		className: "bg-secondary text-foreground border-border",
	},
};

interface AlertProps {
	variant?: keyof typeof variants;
	title?: string;
	children: React.ReactNode;
	className?: string;
}

export function Alert({ variant = "default", title, children, className }: AlertProps) {
	const { icon: Icon, className: variantClass } = variants[variant];

	return (
		<div
			className={cn("flex gap-3 rounded-lg border p-3", variantClass, className)}
			role="alert">
			<Icon className="h-4 w-4 shrink-0 mt-0.5" />
			<div>
				{title && <h5 className="mb-1 text-sm font-medium leading-none">{title}</h5>}
				<div className="text-xs">{children}</div>
			</div>
		</div>
	);
}
