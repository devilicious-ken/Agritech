"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Leaf, Eye, EyeOff } from "lucide-react";

const LoginPage = ({ initialEmail = "" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Redirect away from login if already authenticated — only when actually on /login
  useEffect(() => {
    // run only on the actual /login route and only once
    if (pathname !== "/login") return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      try {
        // cheap session flag to avoid re-check storms
        if (sessionStorage.getItem("signedIn") === "1") {
          router.replace("/dashboard");
          return;
        }
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          sessionStorage.setItem("signedIn", "1");
          router.replace("/dashboard");
        }
      } catch (e) {
        // not authenticated -> stay on login
      }
    })();
  }, [pathname, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensure cookie is accepted by browser
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const err = await loginRes
          .json()
          .catch(() => ({ error: "Login failed" }));
        setLoginError(err.error || "Login failed");
        setLoading(false);
        return;
      }

      // Confirm auth by calling /api/auth/me (no cache) before redirecting
      const meRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (meRes.ok) {
        router.replace("/dashboard");
      } else {
        setLoginError(
          "Login succeeded but verification failed. Check cookies or server logs."
        );
      }
    } catch (err) {
      console.error(err);
      setLoginError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#1f2937]">
      {/* Left Column - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/geo/agri-hero.jpg"
          alt="Agricultural landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#14532d]/80 to-[#0e4d63]/60" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-6">
              <Leaf className="h-16 w-16 text-[#f5b301] drop-shadow-[0_0_15px_rgba(0,0,0,0.9)]" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Jasaan AgriTech Hub
            </h1>
            <p className="text-xl opacity-90 text-gray-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
              Empowering agricultural communities through digital innovation
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-[#0f141d] to-[#1f2937]/20">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="h-12 w-12 text-[#14532d]" />
            </div>
            <p className="text-[#b8b89d]">Agricultural Management System</p>
          </div>

          <Card className="shadow-[0_10px_30px_-10px_rgba(20,83,45,0.3)] border-[#1f2937]/50 bg-[#0f141d]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-[#f7f7f1]">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-[#b8b89d]">
                Sign in to access the agricultural management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-300"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 border-[#1f2937] bg-[#0f141d] text-[#f7f7f1]"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 transition-all duration-300 border-[#1f2937] bg-[#0f141d] text-[#f7f7f1]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#b8b89d] hover:text-[#f7f7f1] transition-all duration-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-password"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="border-gray-400"
                  />
                  <label
                    htmlFor="show-password"
                    className="text-sm font-medium text-gray-300"
                  >
                    Show Password
                  </label>
                </div>

                {loginError && (
                  <div className="text-sm text-red-400">{loginError}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#14532d] hover:bg-[#1f7a40] shadow-[0_10px_30px_-10px_rgba(20,83,45,0.3)] text-white transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <footer className="text-center text-sm text-[#b8b89d]">
            <p>&copy; 2025 Jasaan AgriTech Hub. All rights reserved.</p>
            <p className="mt-1">Barangay Agricultural Management System</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
