"use client";
import { useState } from "react";
import { account } from "@/lib/appwrite";
import { LockClosedIcon, EnvelopeIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Use Appwrite's built-in session management with email/password only
      await account.createSession(form.email, form.password);
      
      // Fetch user details
      const user = await account.get();
      
      // Store user data in localStorage for persistence across the app
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      toast.success('Login successful!');
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: Error) {
      console.error("Login error:", err);
      // More specific error message based on the error
      if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Invalid email or password");
      }
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">
      <div className="flex-grow flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <span className="text-3xl font-bold">
              Supply<span className="text-green-500">Flow</span>
            </span>
            <span className="text-gray-400 text-sm mt-2">Login to your account</span>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative group">
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative group">
              <LockClosedIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                className="pl-10 pr-10 py-2.5 border border-slate-600 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-700 text-white placeholder-gray-400"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
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
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white py-2 rounded-lg transition disabled:opacity-60"
              disabled={loading}
            >
              {loading && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
              Login
            </button>
          </form>
          <div className="text-center mt-4 text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Sign up
            </Link>
          </div>
          <div className="text-center mt-2 text-sm">
            <Link href="/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.7s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
