import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== "true") {
    redirect("/products");
  }

  return <RegisterForm />;
}
