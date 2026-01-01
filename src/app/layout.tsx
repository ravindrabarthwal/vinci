import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ErrorHandlerProvider } from "@/components/providers/error-handler-provider";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Vinci",
	description: "Built with Next.js, Convex, and Better Auth",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				<ErrorHandlerProvider>
					<ConvexClientProvider>{children}</ConvexClientProvider>
				</ErrorHandlerProvider>
			</body>
		</html>
	);
}
