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
	BookOpen,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
		<aside className="flex h-screen w-56 flex-col border-r">
			{/* Logo */}
			<div className="flex h-14 items-center px-5">
				<span className="text-sm font-semibold tracking-tight">OpenScribe</span>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-3 py-2 space-y-0.5">
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
								"flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
								isActive
									? "bg-secondary text-foreground font-medium"
									: "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
							)}>
							<item.icon className="h-3.5 w-3.5" />
							{item.name}
						</Link>
					);
				})}
			</nav>

			{/* Bottom */}
			<div className="border-t px-3 py-2 space-y-0.5">
				<Link
					href="/docs"
					className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60">
					<BookOpen className="h-3.5 w-3.5" />
					Docs
				</Link>
				<div className="flex items-center justify-between px-2.5 py-1">
					<span className="text-[11px] text-muted-foreground">Theme</span>
					<ThemeToggle />
				</div>
				<button
					onClick={() => logout()}
					className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60">
					<LogOut className="h-3.5 w-3.5" />
					Sign out
				</button>
			</div>
		</aside>
	);
}
