"use client";

import React from "react";
import { account } from "@/lib/appwrite";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      if (typeof window !== "undefined") {
        window.location.href = "/athu/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="hover:text-red-400 cursor-pointer"
      type="button"
    >
      Logout
    </button>
  );
}
