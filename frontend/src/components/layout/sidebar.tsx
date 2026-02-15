"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	FileText,
	Target,
	PenTool,
	BarChart3,
	Settings,
	LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Posts", href: "/dashboard/posts", icon: FileText },
	{ name: "Strategy", href: "/dashboard/strategy", icon: Target },
	{ name: "Drafts", href: "/dashboard/drafts", icon: PenTool },
	{ name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
	{ name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
	const pathname = usePathname();
	const logout = useAuthStore((s) => s.logout);

	return (
		<aside className="flex h-screen w-64 flex-col border-r bg-card">
			{/* Logo */}
			<div className="flex h-16 items-center gap-2 border-b px-6">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
					OS
				</div>
				<span className="text-lg font-bold">OpenScribe</span>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 p-4">
				{navigation.map((item) => {
					const isActive =
						item.href === "/dashboard"
							? pathname === "/dashboard"
							: pathname.startsWith(item.href);
					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}>
							<item.icon className="h-5 w-5" />
							{item.name}
						</Link>
					);
				})}
			</nav>

			{/* Logout */}
			<div className="border-t p-4">
				<button
					onClick={() => logout()}
					className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
					<LogOut className="h-5 w-5" />
					Logout
				</button>
			</div>
		</aside>
	);
}
