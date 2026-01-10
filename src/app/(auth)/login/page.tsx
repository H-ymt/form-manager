import { LoginForm } from "@/features/auth/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
