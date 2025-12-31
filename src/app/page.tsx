import Link from "next/link";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex w-full max-w-lg flex-col items-center gap-8 px-6 text-center">
				<h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Vinci</h1>
				<p className="text-lg text-zinc-600 dark:text-zinc-400">
					Built with Next.js, Convex, and Better Auth
				</p>
				<div className="flex flex-col gap-4 sm:flex-row">
					<Link
						href="/login"
						className="flex h-12 w-40 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
					>
						Sign In
					</Link>
					<Link
						href="/signup"
						className="flex h-12 w-40 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
					>
						Sign Up
					</Link>
				</div>
			</main>
		</div>
	);
}
