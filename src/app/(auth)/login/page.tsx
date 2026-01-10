import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="">
      <div className="">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
