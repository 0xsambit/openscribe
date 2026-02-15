"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function RegisterPage() {
	const router = useRouter();
	const register = useAuthStore((s) => s.register);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setIsLoading(true);
		try {
			await register(email, password, name);
			router.push("/dashboard");
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { error?: { message?: string } } } })?.response
					?.data?.error?.message || "Registration failed. Please try again.";
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
					<p className="text-sm text-muted-foreground">Create your account</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && <Alert variant="error">{error}</Alert>}
					<div className="space-y-1.5">
						<Label htmlFor="name" className="text-xs">
							Name
						</Label>
						<Input
							id="name"
							placeholder="Your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
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
							placeholder="Min 8 characters"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="confirmPassword" className="text-xs">
							Confirm Password
						</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Repeat password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>
					</div>
					<Button type="submit" className="w-full" size="sm" isLoading={isLoading}>
						Create account
					</Button>
				</form>
				<p className="text-center text-xs text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="text-foreground hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
