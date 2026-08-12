"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshToken } from "@/lib/api";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  state: boolean;
}

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");

    if (!stored || !token) {
      if (requireAuth) {
        router.replace("/login");
      }
      setLoading(false);
      return;
    }

    setUser(JSON.parse(stored));

    if (refresh) {
      refreshToken(refresh)
        .then((data) => {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {
          if (requireAuth) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            router.replace("/login");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [requireAuth, router]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    router.replace("/login");
  };

  return { user, loading, logout };
}
