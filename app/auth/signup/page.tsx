"use client";

import React, { useState } from "react";
import { account, databases } from "@/lib/appwrite";
import Link from "next/link";
import { ID } from "appwrite";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Create session with Appwrite
      const session = await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const user = await account.get();

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.$id,
        name: user.name,
        email: user.email,
        session: session.$id
      }));

      toast.success('Login successful!');
      setMessage("Login successful! Redirecting to dashboard...");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.type === 'user_invalid_credentials') {
        setMessage("Error: Invalid email or password.");
        toast.error("Invalid email or password.");
      } else {
        setMessage("Error: Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create user in Appwrite Auth
      const user = await account.create(
        ID.unique(),
        email,
        password,
        fullName
      );

      // 2. Save profile info in your database collection
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        ID.unique(),
        {
          user_id: user.$id,
          full_name: fullName,
          email: email,
          company: company,
          created_at: new Date().toISOString(),
        }
      );

      toast.success('Registration successful!');
      setMessage("Registration successful! Please log in to continue.");
      
      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCompany("");

      // Switch to login form
      setIsLogin(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.type === 'user_already_exists') {
        setMessage("Error: An account with this email already exists.");
        toast.error("An account with this email already exists.");
      } else if (error.type === 'user_invalid_credentials') {
        setMessage("Error: Invalid email or password format.");
        toast.error("Invalid email or password format.");
      } else {
        setMessage("Error: Registration failed. Please try again.");
        toast.error("Registration failed. Please try again.");
    }
    } finally {
      setLoading(false);
  }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex-grow flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <span className="text-3xl font-bold text-white">
              Supply<span className="text-indigo-500">Flow</span>
            </span>
            <span className="text-gray-400 text-sm mt-2">
              {isLogin ? "Login to your account" : "Create your account"}
            </span>
          </div>

          {message && (
            <div
              className={`${
                message.includes("Error")
                  ? "bg-red-900/30 border-red-800 text-red-400"
                  : "bg-green-900/30 border-green-800 text-green-400"
              } border px-4 py-3 rounded mb-4 text-sm`}
            >
              {message}
            </div>
          )}

          <form className="space-y-5" onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <>
            {/* Full Name */}
            <div className="relative group">
              <UserIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
              />
            </div>

                {/* Company */}
                <div className="relative group">
                  <BuildingOfficeIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <input
                    className="pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                    type="text"
                    placeholder="Company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative group">
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <LockClosedIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-10 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {!isLogin && (
              /* Confirm Password */
            <div className="relative group">
              <LockClosedIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-10 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                  minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-indigo-500 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-green-500 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-green-600 transition-all disabled:opacity-70"
              disabled={loading}
            >
              {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setFullName("");
                setCompany("");
              }}
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.7s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
