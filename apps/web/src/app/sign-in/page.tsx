import type { Metadata } from "next";
import { Logo } from "@/components/site/nav";
import { Component } from "@/components/ui/sign-in-card-2";

export const metadata: Metadata = { title: "Вход" };

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#07090b]">
      <div className="bg-grid absolute inset-0 opacity-40 invert" />
      <div className="absolute top-1/4 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-teal-500/15 blur-[140px]" />
      <div className="absolute right-[10%] bottom-0 size-[420px] rounded-full bg-violet-600/20 blur-[140px]" />
      <Logo className="absolute top-6 left-6 text-white" />
      <Component />
    </div>
  );
}
