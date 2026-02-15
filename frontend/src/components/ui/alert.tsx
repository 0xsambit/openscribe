"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const variants = {
	default: {
		icon: Info,
		className:
			"bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800",
	},
	success: {
		icon: CheckCircle2,
		className:
			"bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800",
	},
	warning: {
		icon: AlertCircle,
		className:
			"bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800",
	},
	error: {
		icon: XCircle,
		className:
			"bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800",
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
			className={cn("flex gap-3 rounded-lg border p-4", variantClass, className)}
			role="alert">
			<Icon className="h-5 w-5 shrink-0 mt-0.5" />
			<div>
				{title && <h5 className="mb-1 font-medium leading-none">{title}</h5>}
				<div className="text-sm">{children}</div>
			</div>
		</div>
	);
}
