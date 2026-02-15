"use client";

import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageLoader } from "@/components/ui/spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { isLoading, isAuthenticated } = useAuth({ requireAuth: true });

	if (isLoading || !isAuthenticated) {
		return <PageLoader />;
	}

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar />
			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />
				<main className="flex-1 overflow-y-auto p-8">{children}</main>
			</div>
		</div>
	);
}
