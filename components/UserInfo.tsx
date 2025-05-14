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
        // Get current user from Appwrite account
        const user = await account.get();
        // Query the database for the user document by email
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
      } catch (err) {
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
    <div className="flex items-center gap-2 text-gray-400">
      <UserIcon className="w-5 h-5" /> Loading profile...
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 text-red-500">
      <UserIcon className="w-5 h-5" /> {error}
    </div>
  );
  if (!profile) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-5 shadow-lg flex items-center gap-4 max-w-md">
      <div className="bg-indigo-600 rounded-full p-3">
        <UserIcon className="w-8 h-8 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-lg text-white">{profile.full_name}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <EnvelopeIcon className="w-4 h-4" />
          <span className="text-sm">{profile.email}</span>
        </div>
      </div>
    </div>
  );
}
