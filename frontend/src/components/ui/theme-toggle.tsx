"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return (
			<button className={cn("rounded-md p-1.5 text-muted-foreground", className)}>
				<Sun className="h-4 w-4" />
			</button>
		);
	}

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className={cn(
				"rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
				className,
			)}
			title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
			{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
		</button>
	);
}
