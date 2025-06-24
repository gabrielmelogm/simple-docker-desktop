import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DockerComposeService } from "@/screens/docker-containers";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	ExternalLink,
	Pause,
	Trash,
} from "lucide-react";
import { Fragment, useMemo } from "react";

type Item = DockerComposeService;

// Group containers by project
function groupContainersByProject(containers: DockerComposeService[]) {
	const grouped = containers.reduce(
		(acc, container) => {
			const project = container.project;
			if (!acc[project]) {
				acc[project] = [];
			}
			acc[project].push(container);
			return acc;
		},
		{} as Record<string, DockerComposeService[]>,
	);

	return Object.entries(grouped).map(([project, containers]) => ({
		id: project,
		project,
		containers,
		isGroup: true,
	}));
}

export function CollapsibleTable({
	data,
	onStopContainer,
	onRemoveContainer,
}: {
	data: Item[];
	onStopContainer?: (id: string) => void;
	onRemoveContainer?: (id: string) => void;
}) {
	// Group data by project
	const groupedData = useMemo(() => {
		const groups = groupContainersByProject(data);
		return groups.map((group) => ({
			...group,
			id: `group-${group.project}`,
			isGroup: true,
		}));
	}, [data]);

	const columns: ColumnDef<any>[] = [
		{
			id: "expander",
			header: () => null,
			cell: ({ row }) => {
				const isGroup = row.original.isGroup;
				const canExpand = isGroup ? row.original.containers.length > 0 : false;

				return canExpand ? (
					<Button
						{...{
							className: "size-7 shadow-none text-muted-foreground",
							onClick: row.getToggleExpandedHandler(),
							"aria-expanded": row.getIsExpanded(),
							"aria-label": row.getIsExpanded()
								? `Collapse project ${row.original.project}`
								: `Expand project ${row.original.project}`,
							size: "icon",
							variant: "ghost",
						}}
					>
						{row.getIsExpanded() ? (
							<ChevronUpIcon
								className="opacity-60"
								size={16}
								aria-hidden="true"
							/>
						) : (
							<ChevronDownIcon
								className="opacity-60"
								size={16}
								aria-hidden="true"
							/>
						)}
					</Button>
				) : undefined;
			},
		},
		{
			header: "Container ID",
			accessorKey: "id",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return (
						<div className="font-bold text-lg">{row.original.project}</div>
					);
				}
				return (
					<div className="font-medium ml-4">
						{row.original.id ? row.original.id.substring(0, 12) : "-"}
					</div>
				);
			},
		},
		{
			header: "Image",
			accessorKey: "image",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return <div className="text-muted-foreground">Project Group</div>;
				}
				return <div className="ml-4">{row.original.image || "-"}</div>;
			},
		},
		{
			header: "Project",
			accessorKey: "project",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return (
						<div className="text-muted-foreground">
							{row.original.containers.length} containers
						</div>
					);
				}
				return <div className="ml-4">{row.original.project || "-"}</div>;
			},
		},
		{
			header: "Container Name",
			accessorKey: "containerName",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return <div className="text-muted-foreground">-</div>;
				}
				return <div className="ml-4">{row.original.containerName || "-"}</div>;
			},
		},
		{
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					const statuses = row.original.containers
						.map((c: DockerComposeService) => c.status)
						.filter(Boolean);
					const upCount = statuses.filter((s: string) =>
						s.includes("Up"),
					).length;
					const totalCount = statuses.length;
					return (
						<span className="inline-flex text-sm font-semibold rounded-full">
							<Badge variant="secondary" className="gap-1.5">
								<span
									className={cn("size-1.5 rounded-full", {
										"bg-emerald-500": upCount > 0,
										"bg-red-500": upCount === 0,
									})}
								></span>
								{upCount}/{totalCount} running
							</Badge>
						</span>
					);
				}

				const getStatusColor = (status: string): "up" | "exited" => {
					if (status?.includes("Up")) return "up";
					if (status?.includes("Exited") || status?.includes("Down"))
						return "exited";
					return "exited";
				};

				return (
					<div className="ml-4">
						<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
							<Badge variant="secondary" className="gap-1.5">
								<span
									className={cn("size-1.5 rounded-full", {
										"bg-emerald-500":
											getStatusColor(row.original.status) === "up",
										"bg-red-500":
											getStatusColor(row.original.status) === "exited",
									})}
								></span>
								{row.original.status || "Unknown"}
							</Badge>
						</span>
					</div>
				);
			},
		},
		{
			header: "Ports",
			accessorKey: "ports",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return <div className="text-muted-foreground">-</div>;
				}

				return (
					<div className="ml-4">
						{row.original.ports ? (
							<a
								href={`http://localhost:${row.original.ports.split(":")[1]}`}
								target="_blank"
								className="flex items-center justify-center gap-2 text-blue-500 cursor-pointer"
							>
								{row.original.ports}
								<ExternalLink className="size-4 mb-2" />
							</a>
						) : (
							"-"
						)}
					</div>
				);
			},
		},
		{
			header: "",
			id: "actions",
			cell: ({ row }) => {
				if (row.original.isGroup) {
					return <div className="text-muted-foreground">-</div>;
				}

				const getStatusColor = (status: string): "up" | "exited" => {
					if (status?.includes("Up")) return "up";
					if (status?.includes("Exited") || status?.includes("Down"))
						return "exited";
					return "exited";
				};

				return (
					<div className="flex items-center gap-2 ml-4">
						<Button
							onClick={() => {
								if (
									getStatusColor(row.original.status) !== "exited" &&
									onStopContainer &&
									row.original.id
								) {
									onStopContainer(row.original.id);
								}
							}}
							asChild
						>
							<div
								className={cn(
									"flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground",
									{
										"opacity-40 cursor-not-allowed":
											getStatusColor(row.original.status) === "exited" ||
											!row.original.id,
									},
								)}
							>
								<Pause className="size-4 text-yellow-600" />
							</div>
						</Button>
						<Button
							onClick={() => {
								if (onRemoveContainer && row.original.id) {
									onRemoveContainer(row.original.id);
								}
							}}
							asChild
						>
							<div className="flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground">
								<Trash className="size-4 text-red-600" />
							</div>
						</Button>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: groupedData,
		columns,
		getRowCanExpand: (row) => {
			return row.original.isGroup && row.original.containers.length > 0;
		},
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
	});

	return (
		<div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="hover:bg-transparent">
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<Fragment key={row.id}>
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={cn(
										row.original.isGroup && "bg-muted/50 font-semibold",
									)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="whitespace-nowrap [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
								{row.getIsExpanded() && row.original.isGroup && (
									<>
										{row.original.containers.map(
											(container: DockerComposeService) => (
												<TableRow
													key={container.id || `container-${Math.random()}`}
													className="bg-background"
												>
													<TableCell className="w-px py-0 pr-0"></TableCell>
													<TableCell>
														<div className="font-medium ml-4">
															{container.id
																? container.id.substring(0, 12)
																: "-"}
														</div>
													</TableCell>
													<TableCell>
														<div className="ml-4">{container.image || "-"}</div>
													</TableCell>
													<TableCell>
														<div className="ml-4">
															{container.project || "-"}
														</div>
													</TableCell>
													<TableCell>
														<div className="ml-4">
															{container.containerName || "-"}
														</div>
													</TableCell>
													<TableCell>
														<div className="ml-4">
															<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
																<Badge variant="secondary" className="gap-1.5">
																	<span
																		className={cn("size-1.5 rounded-full", {
																			"bg-emerald-500":
																				container.status?.includes("Up"),
																			"bg-red-500":
																				container.status?.includes("Exited") ||
																				container.status?.includes("Down"),
																		})}
																	></span>
																	{container.status || "Unknown"}
																</Badge>
															</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="ml-4">
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
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2 ml-4">
															<Button
																onClick={() => {
																	if (
																		!container.status?.includes("Exited") &&
																		!container.status?.includes("Down") &&
																		onStopContainer &&
																		container.id
																	) {
																		onStopContainer(container.id);
																	}
																}}
																asChild
															>
																<div
																	className={cn(
																		"flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground",
																		{
																			"opacity-40 cursor-not-allowed":
																				container.status?.includes("Exited") ||
																				container.status?.includes("Down") ||
																				!container.id,
																		},
																	)}
																>
																	<Pause className="size-4 text-yellow-600" />
																</div>
															</Button>
															<Button
																onClick={() => {
																	if (onRemoveContainer && container.id) {
																		onRemoveContainer(container.id);
																	}
																}}
																asChild
															>
																<div className="flex items-center cursor-pointer transition-all duration-300 hover:bg-accent-foreground">
																	<Trash className="size-4 text-red-600" />
																</div>
															</Button>
														</div>
													</TableCell>
												</TableRow>
											),
										)}
									</>
								)}
							</Fragment>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
