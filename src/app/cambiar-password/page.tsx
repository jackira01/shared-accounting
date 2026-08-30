import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { CambiarPasswordForm } from "./cambiar-password-form";

export default async function CambiarPasswordPage() {
  const user = await getCurrentUser();
  if (!user.mustChangePassword) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <CambiarPasswordForm />
    </div>
  );
}
