"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/LogInPage";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@agritech.gov");
  const [password, setPassword] = useState("password");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "admin@agritech.gov" && password === "password") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("isLoggedIn", "true");
      }
      setLoginError("");
      router.push("/dashboard");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  return (
    <LoginPage
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      loginError={loginError}
      handleLogin={handleLogin}
    />
  );
}
