import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "../lib/supabase";

import {
  getProfile,
  updateProfile as updateProfileInDB,
  type UserProfile,
} from "../services/profileService";

interface ProfileContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileSaving: boolean;
  profileError: string | null;

  refreshProfile: () => Promise<void>;

  updateProfile: (
    profile: UserProfile
  ) => Promise<void>;
}

const ProfileContext = createContext<
  ProfileContextValue | undefined
>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({
  children,
}: ProfileProviderProps) {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    profileSaving,
    setProfileSaving,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState<string | null>(null);

  async function refreshProfile() {
    try {
      setProfileLoading(true);
      setProfileError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setProfile(null);
        return;
      }

      const loadedProfile =
        await getProfile();

      setProfile(loadedProfile);
    } catch (error) {
      console.error(
        "Failed to load profile:",
        error
      );

      setProfileError(
        "Unable to load your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function updateProfile(
    updatedProfile: UserProfile
  ) {
    try {
      setProfileSaving(true);
      setProfileError(null);

      const savedProfile =
        await updateProfileInDB(
          updatedProfile
        );

      setProfile(savedProfile);
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );

      setProfileError(
        "Unable to save your profile."
      );

      throw error;
    } finally {
      setProfileSaving(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProfile() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          throw error;
        }

        if (!session) {
          setProfile(null);
          setProfileLoading(false);
          return;
        }

        await refreshProfile();
      } catch (error) {
        console.error(
          "Failed to initialize profile:",
          error
        );

        if (isMounted) {
          setProfileError(
            "Unable to initialize your profile."
          );

          setProfileLoading(false);
        }
      }
    }

    void loadInitialProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) {
          return;
        }

        if (
          event === "SIGNED_OUT" ||
          !session
        ) {
          setProfile(null);
          setProfileLoading(false);
          setProfileError(null);
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          void refreshProfile();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value =
    useMemo<ProfileContextValue>(
      () => ({
        profile,
        profileLoading,
        profileSaving,
        profileError,
        refreshProfile,
        updateProfile,
      }),
      [
        profile,
        profileLoading,
        profileSaving,
        profileError,
      ]
    );

  return (
    <ProfileContext.Provider
      value={value}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context =
    useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfile must be used inside ProfileProvider"
    );
  }

  return context;
}