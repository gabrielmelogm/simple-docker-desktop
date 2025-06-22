import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Pause } from "lucide-react";

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

  const parseDockerOutput = (output: string): DockerContainer[] => {
    const lines = output.trim().split('\n');
    if (lines.length === 0) return [];
    
    // No header line to skip since we removed the table format
    return lines.map(line => {
      const parts = line.split('\t');
      if (parts.length >= 5) {
        return {
          id: parts[0].trim(),
          image: parts[1].trim(),
          status: parts[2].trim(),
          ports: parts[3].trim(),
          names: parts[4].trim()
        };
      }
      return null;
    }).filter((container): container is DockerContainer => container !== null);
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
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): "up" | "exited" => {
    if (status.includes("Up")) return "up";
    if (status.includes("Exited")) return "exited";

    return 'exited'
  };

  async function stopContainer(id: string) {
    try {
      await invoke("stop_docker_container", { id });
      await fetchContainers();
    } catch (error) {
      console.error("Error stopping container:", error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="rounded-lg shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Docker Containers
            </h2>
            <Button
              onClick={fetchContainers}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 mr-2"></div>
                  Loading...
                </div>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Error loading containers
                  </h3>
                  <div className="mt-2 text-sm">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {containers.length === 0 && !loading && !error ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium">No containers running</h3>
              <p className="mt-1 text-sm">
                Start some Docker containers to see them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Container ID
                    </TableHead>
                    <TableHead>
                      Image
                    </TableHead>
                    <TableHead>
                      Status
                    </TableHead>
                    <TableHead>
                      Ports
                    </TableHead>
                    <TableHead>
                      Names
                    </TableHead>
                    <TableHead>
                      
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((container) => (
                    <TableRow key={container.id}>
                      <TableCell>
                        {container.id.substring(0, 12)}
                      </TableCell>
                      <TableCell>
                        {container.image}
                      </TableCell>
                      <TableCell>
                        <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full'}>
                          <Badge variant="secondary" className="gap-1.5">
                            <span className={cn("size-1.5 rounded-full", {
                              'bg-emerald-500': getStatusColor(container.status) === 'up',
                              'bg-red-500': getStatusColor(container.status) === 'exited',
                            })}></span>
                            {container.status}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        {container.ports || "-"}
                      </TableCell>
                      <TableCell>
                        {container.names}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => stopContainer(container.id)}
                          variant="destructive" disabled={getStatusColor(container.status) === 'exited'}
                        >
                          <Pause className="text-red-800" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="w-full">
                <span className="block pt-2 text-sm">{containers.length} containers found</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 