import { Route, Routes } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { DockerContainers } from "./screens/docker-containers";

export function Router() {
	return (
		<Routes>
			<Route path="/" element={<RootLayout />}>
				<Route index element={<DockerContainers />} />
			</Route>
		</Routes>
	);
}
