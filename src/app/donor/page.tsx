"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DonorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div className="page-shell py-20 text-center text-sm text-stone-400">
      Redirecting to profile...
    </div>
  );
}
