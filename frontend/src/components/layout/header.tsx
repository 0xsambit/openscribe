"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Bell } from "lucide-react";

export function Header() {
	const user = useAuthStore((s) => s.user);

	return (
		<header className="flex h-16 items-center justify-between border-b bg-card px-6">
			<div />
			<div className="flex items-center gap-4">
				<button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
					<Bell className="h-5 w-5" />
				</button>
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
						{user?.name?.charAt(0).toUpperCase() || "U"}
					</div>
					<div className="hidden sm:block">
						<p className="text-sm font-medium">{user?.name || "User"}</p>
						<p className="text-xs text-muted-foreground">{user?.email}</p>
					</div>
				</div>
			</div>
		</header>
	);
}
