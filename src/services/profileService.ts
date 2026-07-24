import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  preferred_currency: string;
  timezone: string;
  monthly_salary: number;
  salary_day: number;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  monthly_salary: number | string | null;
  salary_day: number | string | null;
  created_at: string;
  updated_at: string;
}

function mapProfileRow(
  row: ProfileRow
): UserProfile {
  return {
    id: row.id,
    full_name: row.full_name ?? "",
    avatar_url: row.avatar_url,
    phone: row.phone,
    preferred_currency:
      row.preferred_currency ?? "INR",
    timezone:
      row.timezone ?? "Asia/Kolkata",
    monthly_salary: Number(
      row.monthly_salary ?? 0
    ),
    salary_day: Number(
      row.salary_day ?? 1
    ),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProfile(): Promise<UserProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        avatar_url,
        phone,
        preferred_currency,
        timezone,
        monthly_salary,
        salary_day,
        created_at,
        updated_at
      `
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(
    data as ProfileRow
  );
}

export async function updateProfile(
  profile: UserProfile
): Promise<UserProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "User is not authenticated."
    );
  }

  if (user.id !== profile.id) {
    throw new Error(
      "You cannot update another user's profile."
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.full_name.trim(),
      avatar_url:
        profile.avatar_url?.trim() || null,
      phone:
        profile.phone?.trim() || null,
      preferred_currency:
        profile.preferred_currency,
      timezone: profile.timezone,
      monthly_salary:
        profile.monthly_salary,
      salary_day: profile.salary_day,
    })
    .eq("id", user.id)
    .select(
      `
        id,
        full_name,
        avatar_url,
        phone,
        preferred_currency,
        timezone,
        monthly_salary,
        salary_day,
        created_at,
        updated_at
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(
    data as ProfileRow
  );
}