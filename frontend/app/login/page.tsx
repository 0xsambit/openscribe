"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
	const router = useRouter();
	const login = useAuthStore((s) => s.login);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await login(email, password);
			router.push("/dashboard");
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { error?: { message?: string } } } })?.response
					?.data?.error?.message || "Invalid email or password";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-lg font-semibold">OpenScribe</h1>
					<p className="text-sm text-muted-foreground">Sign in to your account</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && <Alert variant="error">{error}</Alert>}
					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-xs">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="password" className="text-xs">
							Password
						</Label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<Button type="submit" className="w-full" size="sm" isLoading={isLoading}>
						Sign in
					</Button>
				</form>
				<p className="text-center text-xs text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link href="/register" className="text-foreground hover:underline">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
