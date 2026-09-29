"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, Layers, AlertCircle } from "lucide-react";
import { httpClient } from "@/lib/httpClient";
import { LOCAL_KEYS } from "@/constants/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const schema = z.object({
  username: z.string().optional(),
  password: z.string().min(1, "Password is required"),
});

type SigninDto = z.infer<typeof schema>;

type LoginResponse = {
  _id: string;
  username: string;
  role: string;
  token: string;
}

export default function Page() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninDto>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: SigninDto) => {
    setServerError(null);
    try {
      const res = await httpClient.post<LoginResponse>("/auth/signin", data);
      const { token, username, role, _id } = res.data;
      localStorage.setItem(LOCAL_KEYS.TOKEN, token);
      localStorage.setItem("OPS_DESK_USER", JSON.stringify({ username, role, _id }));
      router.replace("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      setServerError(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(0_113_227/0.16),transparent)] dark:bg-[radial-gradient(closest-side,rgb(10_132_255/0.22),transparent)]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[480px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(175_82_222/0.10),transparent)]" />
      </div>

      <div className="relative w-full max-w-[380px] space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-[16px] bg-gradient-to-b from-[#2997ff] to-[#0062d1] flex items-center justify-center shadow-[0_8px_24px_-6px_rgb(0_113_227/0.5),inset_0_1px_0_rgb(255_255_255/0.25)]">
            <Layers className="h-7 w-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-[32px] leading-tight font-semibold tracking-[-0.03em]">OpsDesk</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Asset & Maintenance Management</p>
        </div>

        <Card className="gap-5 py-7 shadow-elevated bg-card/80 backdrop-blur-xl">
          <CardHeader className="px-7 gap-1">
            <CardTitle className="text-[17px]">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent className="px-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="h-11 rounded-xl px-3.5 md:text-[15px]"
                  {...register("username")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-11 rounded-xl px-3.5 pr-11 md:text-[15px]"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p className="flex items-center gap-2 text-[13px] text-destructive bg-destructive/[0.08] px-3.5 py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
