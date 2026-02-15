"use client";

import { useAuthStore } from "@/stores/auth-store";

export function Header() {
	const user = useAuthStore((s) => s.user);

	return (
		<header className="flex h-12 items-center justify-end border-b px-6">
			<div className="flex items-center gap-2.5">
				<div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
					{user?.name?.charAt(0).toUpperCase() || "U"}
				</div>
				<span className="text-xs text-muted-foreground">{user?.name || "User"}</span>
			</div>
		</header>
	);
}
