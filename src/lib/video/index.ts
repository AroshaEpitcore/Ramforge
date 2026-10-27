import "server-only";

import { env } from "@/lib/env";
import { mockVideoProvider } from "./mock-provider";
import { muxVideoProvider } from "./mux-provider";
import type { VideoProvider } from "./types";

export type { VideoProvider } from "./types";

/**
 * Resolve the configured video provider. Mux is implemented for paid lessons;
 * Cloudflare/Bunny remain unimplemented and throw so the choice stays explicit.
 * Local dev uses the mock until Mux credentials are supplied.
 */
export function getVideoProvider(): VideoProvider {
  switch (env.VIDEO_PROVIDER) {
    case "mock":
      return mockVideoProvider;
    case "mux":
      return muxVideoProvider;
    case "cloudflare":
    case "bunny":
      throw new Error(
        `Video provider "${env.VIDEO_PROVIDER}" is not implemented. Implement the VideoProvider interface in src/lib/video/.`,
      );
    default:
      return mockVideoProvider;
  }
}
