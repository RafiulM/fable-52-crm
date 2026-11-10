import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Buat akun" };
export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
