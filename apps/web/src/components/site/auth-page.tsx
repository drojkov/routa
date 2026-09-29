import "server-only";
import { AuthCard, type ProviderMode } from "@/components/site/auth-card";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Logo } from "@/components/site/nav";
import { DEMO_OAUTH, OAUTH } from "@/lib/auth";

/** Какой режим у кнопки Google: настоящий OAuth, демо-вход или скрыта. */
export function authProviders(): Record<"google", ProviderMode> {
  const mode = (on: boolean): ProviderMode => (on ? "live" : DEMO_OAUTH ? "demo" : "off");
  return { google: mode(OAUTH.google) };
}

export function AuthPage(props: React.ComponentProps<typeof AuthCard>) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#07090b] py-20">
      <div className="bg-grid absolute inset-0 opacity-40 invert" />
      <div className="absolute top-1/4 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-teal-500/15 blur-[140px]" />
      <div className="absolute right-[10%] bottom-0 size-[420px] rounded-full bg-violet-600/20 blur-[140px]" />
      <Logo className="absolute top-6 left-6 text-white" />
      <div className="absolute top-5 right-5">
        <LocaleSwitcher dark />
      </div>
      <AuthCard {...props} />
    </div>
  );
}
