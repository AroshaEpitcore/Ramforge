import "server-only";

import { env } from "@/lib/env";
import { mockVideoProvider } from "./mock-provider";
import type { VideoProvider } from "./types";

export type { VideoProvider } from "./types";

/**
 * Resolve the configured video provider. Only the mock is implemented in the
 * scaffold; real providers throw until wired, so the choice is explicit.
 */
export function getVideoProvider(): VideoProvider {
  switch (env.VIDEO_PROVIDER) {
    case "mock":
      return mockVideoProvider;
    case "mux":
    case "cloudflare":
    case "bunny":
      throw new Error(
        `Video provider "${env.VIDEO_PROVIDER}" is not implemented yet. Implement the VideoProvider interface in src/lib/video/.`,
      );
    default:
      return mockVideoProvider;
  }
}
