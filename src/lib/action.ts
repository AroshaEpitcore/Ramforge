import type { ActionResult } from "@/types";
import { z } from "zod";

/**
 * Wrap a Server Action with zod validation and a typed result.
 *
 * ```ts
 * "use server";
 * export const createVideo = defineAction(createVideoSchema, async (input) => {
 *   requirePermission(await getCurrentUser(), "videos:create");
 *   return db.video.create({ data: input });
 * });
 * ```
 *
 * Returns `{ ok: true, data }` on success, or
 * `{ ok: false, error, fieldErrors? }` on validation/handler failure — never
 * throws to the caller.
 */
export function defineAction<TSchema extends z.ZodTypeAny, TOutput>(
  schema: TSchema,
  handler: (input: z.output<TSchema>) => Promise<TOutput>,
) {
  return async (raw: unknown): Promise<ActionResult<TOutput>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return {
        ok: false,
        error: "Please fix the highlighted fields.",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }
    try {
      const data = await handler(parsed.data);
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Something went wrong.",
      };
    }
  };
}
