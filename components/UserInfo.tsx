"use client";
import React, { useEffect, useState } from "react";
import { account, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { UserIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

type UserProfile = {
  $id: string;
  full_name: string;
  email: string;
};

export default function UserProfileInfo() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      try {
        const user = await account.get();
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
          [Query.equal("email", user.email)]
        );
        if (isMounted) {
          if (response.documents.length > 0) {
            setProfile(response.documents[0] as unknown as UserProfile);
            setError(null);
          } else {
            setProfile(null);
            setError("User profile not found in database.");
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        if (isMounted) {
          setProfile(null);
          setError("Please log in to view your profile.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  if (loading) return (
    <div className="flex items-center gap-1 text-gray-400">
      <UserIcon className="w-3 h-3" /> Loading...
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-1 text-red-500">
      <UserIcon className="w-3 h-3" /> {error}
    </div>
  );
  if (!profile) return null;

  return (
    <div className="bg-gray-800/30 rounded-md p-2 flex items-center gap-2">
      <div className="bg-indigo-600/50 rounded-full p-1">
        <UserIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-xs text-white">{profile.full_name}</span>
        <span className="text-[10px] text-gray-400">{profile.email}</span>
      </div>
    </div>
  );
}
