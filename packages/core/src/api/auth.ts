import type { LioClient } from "../supabase";

export async function signUp(client: LioClient, email: string, password: string, displayName?: string) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) throw error;
  return data;
}

export async function signIn(client: LioClient, email: string, password: string) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(client: LioClient) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getSession(client: LioClient) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}
