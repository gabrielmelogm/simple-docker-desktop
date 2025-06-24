import { InputSearch } from "@/components/input-search";
import { CollapsibleTable } from "@/components/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface DockerComposeService {
	id: string;
	project: string;
	service: string;
	containerName: string;
	image: string;
	status: string;
	ports: string;
}

export function DockerContainers() {
	const [containers, setContainers] = useState<DockerComposeService[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [intervalInSeconds, setIntervalInSeconds] = useState<number>(5);
	const [searchValue, setSearchValue] = useState<string>("");
	const [status, setStatus] = useState<Option[]>([
		{ value: "up", label: "UP" },
	]);

	const fetchDockerComposeServices = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await invoke<string>("get_docker_compose_services");
			const data = result.split("\n").filter((line) => line.trim() !== "");
			const parsedServices: DockerComposeService[] = data.map((line) => {
				const [
					project,
					service,
					image,
					status,
					ports,
					portsLong,
					portTcp,
					id,
					containerName,
				] = line.split("->");
				return {
					id,
					project,
					service,
					containerName,
					image,
					status,
					ports,
				};
			});
			setContainers(parsedServices);
		} catch (err) {
			setError(err as string);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDockerComposeServices();

		const interval = setInterval(() => {
			fetchDockerComposeServices();
		}, intervalInSeconds * 1000);

		return () => clearInterval(interval);
	}, [intervalInSeconds, fetchDockerComposeServices]);

	const getStatusColor = (status: string): "up" | "exited" => {
		if (status.includes("Up")) return "up";
		if (status.includes("Exited")) return "exited";

		return "exited";
	};

	async function stopContainer(id: string) {
		try {
			await invoke("stop_docker_container", { id });
			await fetchDockerComposeServices();
		} catch (error) {
			console.error("Error stopping container:", error);
		}
	}

	async function removeContainer(id: string) {
		try {
			await invoke("remove_docker_container", { id });
			await fetchDockerComposeServices();
		} catch (error) {
			console.error("Error removing container:", error);
		}
	}

	const filterBySearch = (container: DockerComposeService) => {
		return (
			container.service.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.project.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.image.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.status.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.ports.toLowerCase().includes(searchValue.toLowerCase())
		);
	};

	const filterByStatus = (container: DockerComposeService) => {
		if (status.length === 0) return true;
		return status.some((s) =>
			container.status.toLowerCase().includes(s.value.toLowerCase()),
		);
	};

	const filteredContainers = containers.filter(
		(container) => filterBySearch(container) && filterByStatus(container),
	);

	const statusOptions: Option[] = [
		...status,
		{
			value: "down",
			label: "DOWN",
		},
		{
			value: "exited",
			label: "EXITED",
		},
	];

	return (
		<div className="max-w-7xl mx-auto pt-8">
			<Card className="rounded-lg shadow-lg">
				<CardHeader>
					<div className="grid grid-cols-3 gap-2 items-center">
						<CardTitle>Docker Containers</CardTitle>
						<div className="w-[220px]">
							<InputSearch
								searchValue={searchValue}
								onSearch={(value) => setSearchValue(value)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button onClick={fetchDockerComposeServices} disabled={loading}>
								{loading ? (
									<Loader2 className="size-4 animate-spin mr-2" />
								) : (
									<RefreshCcw className="size-4" />
								)}
							</Button>
							<Select
								onValueChange={(value) => setIntervalInSeconds(Number(value))}
								defaultValue={String(intervalInSeconds)}
							>
								<SelectTrigger className="w-[120px]">
									<SelectValue placeholder="Refresh interval" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">1 sec</SelectItem>
									<SelectItem value="5">5 sec</SelectItem>
									<SelectItem value="10">10 sec</SelectItem>
									<SelectItem value="30">30 sec</SelectItem>
									<SelectItem value="60">60 sec</SelectItem>
								</SelectContent>
							</Select>
							<div className="*:not-first:mt-2">
								<MultipleSelector
									commandProps={{
										label: "Status",
									}}
									value={status}
									defaultOptions={statusOptions}
									onChange={(value) => setStatus(value)}
									placeholder="Status"
									hideClearAllButton
									hidePlaceholderWhenSelected
									emptyIndicator={
										<p className="text-center text-sm">No results found</p>
									}
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<div className="p-6">
					{error && (
						<div className="mb-4 p-4 rounded-md">
							<div className="flex">
								<div className="flex-shrink-0">
									<AlertCircle className="h-5 w-5" />
								</div>
								<div className="ml-3">
									<h3 className="text-sm font-medium">
										Error loading containers
									</h3>
									<div className="mt-2 text-sm">{error}</div>
								</div>
							</div>
						</div>
					)}

					{containers.length === 0 && !loading && !error ? (
						<div className="text-center py-12">
							<AlertCircle className="h-5 w-5" />
							<h3 className="mt-2 text-sm font-medium">
								No containers running
							</h3>
							<p className="mt-1 text-sm">
								Start some Docker containers to see them here.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<CollapsibleTable
								data={filteredContainers}
								onStopContainer={stopContainer}
								onRemoveContainer={removeContainer}
							/>
							<div className="w-full">
								<span className="block pt-4 text-xs text-muted-foreground">
									{filteredContainers.length} containers found
								</span>
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
