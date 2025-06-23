import { Outlet } from "react-router";
import { Navbar } from "@/components/navbar";

export function RootLayout() {
	return (
		<div className="min-h-screen">
			<main>
				<Navbar />
				<Outlet />
			</main>
		</div>
	);
}
