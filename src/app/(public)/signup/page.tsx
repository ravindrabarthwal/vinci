"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const result = await signUp.email({
				name,
				email,
				password,
			});

			if (result.error) {
				setError(result.error.message ?? "Failed to sign up");
			} else {
				router.push("/dashboard");
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create Account</CardTitle>
					<CardDescription>Enter your details to create a new account</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								disabled={isLoading}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Creating account..." : "Sign Up"}
						</Button>
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link href="/login" className="text-primary hover:underline">
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
