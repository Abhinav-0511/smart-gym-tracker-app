export type SupabaseLikeError = { code?: string; message: string };

export function throwIfError(error: SupabaseLikeError | null): void {
  if (error) throw new Error(error.message);
}
