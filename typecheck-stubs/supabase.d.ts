declare module "@/lib/supabase" {
  // Stub for iCloud-evicted module; real impl returns a Supabase client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getSupabaseServerClient(): any;
}
