import { InputSearch } from "@/components/input-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import {
	AlertCircle,
	ExternalLink,
	Loader2,
	Pause,
	RefreshCcw,
	Trash,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DockerContainer {
	id: string;
	image: string;
	status: string;
	ports: string;
	names: string;
}

export function DockerContainers() {
	const [containers, setContainers] = useState<DockerContainer[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [intervalInSeconds, setIntervalInSeconds] = useState<number>(5);
	const [searchValue, setSearchValue] = useState<string>("");

	function processPorts(ports: string): string {
		return ports.split("->")[0].trim();
	}

	const parseDockerOutput = (output: string): DockerContainer[] => {
		const lines = output.trim().split("\n");
		if (lines.length === 0) return [];

		// No header line to skip since we removed the table format
		return lines
			.map((line) => {
				const parts = line.split("\t");
				if (parts.length >= 5) {
					return {
						id: parts[0].trim(),
						image: parts[1].trim(),
						status: parts[2].trim(),
						ports: processPorts(parts[3].trim()),
						names: parts[4].trim(),
					};
				}
				return null;
			})
			.filter((container): container is DockerContainer => container !== null);
	};

	const fetchContainers = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await invoke<string>("get_docker_containers");
			const parsedContainers = parseDockerOutput(result);
			setContainers(parsedContainers);
		} catch (err) {
			setError(err as string);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContainers();

		const interval = setInterval(() => {
			fetchContainers();
		}, intervalInSeconds * 1000);

		return () => clearInterval(interval);
	}, [intervalInSeconds]);

	const getStatusColor = (status: string): "up" | "exited" => {
		if (status.includes("Up")) return "up";
		if (status.includes("Exited")) return "exited";

		return "exited";
	};

	async function stopContainer(id: string) {
		try {
			await invoke("stop_docker_container", { id });
			await fetchContainers();
		} catch (error) {
			console.error("Error stopping container:", error);
		}
	}

	async function removeContainer(id: string) {
		try {
			await invoke("remove_docker_container", { id });
			await fetchContainers();
		} catch (error) {
			console.error("Error removing container:", error);
		}
	}

	const filteredContainers = containers.filter(
		(container) =>
			container.names.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.image.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.id.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.ports.toLowerCase().includes(searchValue.toLowerCase()) ||
			container.status.toLowerCase().includes(searchValue.toLowerCase()),
	);

	return (
		<div className="max-w-7xl mx-auto pt-8">
			<Card className="rounded-lg shadow-lg">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Docker Containers</CardTitle>
						<InputSearch
							searchValue={searchValue}
							onSearch={(value) => setSearchValue(value)}
						/>
						<div className="flex items-center gap-2">
							<Button onClick={fetchContainers} disabled={loading}>
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
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Container ID</TableHead>
										<TableHead>Image</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Ports</TableHead>
										<TableHead>Names</TableHead>
										<TableHead></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredContainers.map((container) => (
										<TableRow key={container.id}>
											<TableCell>{container.id.substring(0, 12)}</TableCell>
											<TableCell>{container.image}</TableCell>
											<TableCell>
												<span
													className={
														"inline-flex px-2 py-1 text-xs font-semibold rounded-full"
													}
												>
													<Badge variant="secondary" className="gap-1.5">
														<span
															className={cn("size-1.5 rounded-full", {
																"bg-emerald-500":
																	getStatusColor(container.status) === "up",
																"bg-red-500":
																	getStatusColor(container.status) === "exited",
															})}
														></span>
														{container.status}
													</Badge>
												</span>
											</TableCell>
											<TableCell>
												{container.ports ? (
													<a
														href={`http://localhost:${container.ports.split(":")[1]}`}
														target="_blank"
														className="flex items-center justify-center gap-2 text-blue-500 cursor-pointer"
													>
														{container.ports}
														<ExternalLink className="size-4 mb-2" />
													</a>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell>{container.names}</TableCell>
											<TableCell className="flex items-center gap-2">
												<Button
													onClick={() =>
														getStatusColor(container.status) === "exited"
															? null
															: stopContainer(container.id)
													}
													asChild
												>
													<div
														className={cn(
															"flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground",
															{
																"opacity-40 cursor-not-allowed":
																	getStatusColor(container.status) === "exited",
															},
														)}
													>
														<Pause className="size-4 text-yellow-600" />
													</div>
												</Button>
												<Button
													onClick={() => removeContainer(container.id)}
													asChild
												>
													<div
														className={cn(
															"flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground",
														)}
													>
														<Trash className="size-4 text-red-600" />
													</div>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div className="w-full">
								<span className="block pt-2 text-sm">
									{containers.length} containers found
								</span>
							</div>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
