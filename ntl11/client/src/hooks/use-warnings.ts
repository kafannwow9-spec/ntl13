import { useQuery } from "@tanstack/react-query";
import { api, type Warning } from "@shared/routes";

export function useWarnings() {
  return useQuery({
    queryKey: [api.warnings.list.path],
    queryFn: async () => {
      const res = await fetch(api.warnings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch warnings");
      return api.warnings.list.responses[200].parse(await res.json());
    },
  });
}
