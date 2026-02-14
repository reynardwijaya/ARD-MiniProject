"use client";

import { useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function Home() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log(data, error);
    };

    testConnection();
  }, []);

  return <div className="p-10">Supabase Connected ✅</div>;
}
