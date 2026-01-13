import { z } from "zod";
import { warnings, panels } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  warnings: {
    list: {
      method: "GET" as const,
      path: "/api/warnings",
      responses: {
        200: z.array(z.custom<typeof warnings.$inferSelect>()),
      },
    },
  },
  stats: {
    get: {
      method: "GET" as const,
      path: "/api/stats",
      responses: {
        200: z.object({
          warningCount: z.number(),
          panelCount: z.number(),
          botStatus: z.enum(["online", "offline"]),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type Warning = z.infer<typeof api.warnings.list.responses[200]>[number];
