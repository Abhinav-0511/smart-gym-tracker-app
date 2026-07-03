const requiredEnvironmentVariables = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const missingEnvironmentVariables = Object.entries(requiredEnvironmentVariables)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`,
  );
}

export const env = {
  supabaseUrl: requiredEnvironmentVariables.supabaseUrl as string,
  supabaseAnonKey: requiredEnvironmentVariables.supabaseAnonKey as string,
} as const;
