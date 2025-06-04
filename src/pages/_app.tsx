import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const publicPaths = ["/auth/login", "/auth/signup"];
    if (publicPaths.includes(router.pathname)) return;

    const checkSession = async () => {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        router.push("/auth/login");
      }
    };
    checkSession();
  }, [router]);

  return (
    <>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </>
  );
}