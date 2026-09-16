import type { LioClient } from "../supabase";
import type { ProfileInput } from "../schemas/profile";

export async function getMyProfile(client: LioClient) {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateMyProfile(client: LioClient, patch: Partial<ProfileInput>) {
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { data, error } = await client
    .from("profiles")
    .update(patch)
    .eq("id", userData.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
