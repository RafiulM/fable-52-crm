"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Field, fieldAria } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/config/site";

type Errors = Partial<Record<"name" | "email" | "password", string>>;

// Form masuk dan daftar. Akun dikelola Better Auth; halaman ini hanya
// memvalidasi isian, memanggilnya, lalu mengarahkan ke dashboard.
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const nextErrors: Errors = {};
    if (signingUp && !name) nextErrors.name = "Isi nama kamu.";
    if (!/^\S+@\S+\.\S+$/.test(email))
      nextErrors.email = "Isi email dengan format nama@domain.com.";
    if (!password) nextErrors.password = "Isi kata sandi.";
    else if (signingUp && password.length < 8)
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    setErrors(nextErrors);
    setFailure("");
    const firstInvalid = (["name", "email", "password"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPending(true);
    try {
      const result = signingUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setFailure(
          signingUp
            ? "Akun belum bisa dibuat. Email ini mungkin sudah terdaftar; coba masuk, atau pakai email lain."
            : "Email atau kata sandi tidak cocok. Periksa lagi lalu coba masuk.",
        );
        return;
      }
      router.replace(siteConfig.homePath);
      router.refresh();
    } catch {
      setFailure(
        "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid w-full max-w-[400px] gap-6">
      <div className="grid gap-1">
        <p className="text-lg leading-snug font-medium">{siteConfig.name}</p>
        <p className="text-[13px] text-muted-foreground">
          Dashboard performa tim sales
        </p>
      </div>

      <form
        noValidate
        method="post"
        onSubmit={onSubmit}
        aria-busy={pending}
        className="grid gap-4 rounded-lg border bg-card p-6"
      >
        <div className="grid gap-1">
          <h1 className="text-[25px] leading-[1.2] font-medium">
            {signingUp ? "Buat akun" : "Masuk"}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {signingUp
              ? "Akun ini untuk pemilik atau pimpinan tim. Data tim hanya bisa dilihat dari akun ini."
              : "Hanya pemilik atau pimpinan tim yang bisa mengakses data tim."}
          </p>
        </div>

        {signingUp && (
          <Field id="name" label="Nama" error={errors.name}>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              maxLength={100}
              disabled={pending}
              {...fieldAria("name", undefined, errors.name)}
            />
          </Field>
        )}
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete={signingUp ? "email" : "username"}
            maxLength={254}
            disabled={pending}
            {...fieldAria("email", undefined, errors.email)}
          />
        </Field>
        <Field
          id="password"
          label="Kata sandi"
          hint={signingUp ? "Minimal 8 karakter." : undefined}
          error={errors.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            maxLength={128}
            disabled={pending}
            {...fieldAria("password", signingUp, errors.password)}
          />
        </Field>

        {failure && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 px-3 py-2 text-[13px] text-destructive"
          >
            {failure}
          </p>
        )}

        <Button className="w-full" type="submit" size="lg" disabled={pending}>
          {pending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {pending ? "Mohon tunggu…" : signingUp ? "Buat akun" : "Masuk"}
        </Button>
      </form>

      <p className="text-[13px] text-muted-foreground">
        {signingUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link
          className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          href={signingUp ? "/sign-in" : "/sign-up"}
        >
          {signingUp ? "Masuk" : "Buat akun"}
        </Link>
      </p>
    </div>
  );
}
