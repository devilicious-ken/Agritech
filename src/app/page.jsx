"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

      if (isLoggedIn) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }

      setIsChecking(false);
    }
  }, [router]);

  // Show loading state while redirecting
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return null;
}
