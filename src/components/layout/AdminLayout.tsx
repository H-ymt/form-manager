"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FormInput, Mail, FileSpreadsheet, Shield, Menu, LogOut, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { signOut } from "@/server/auth/client";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const navigation = [
  { name: "送信内容", href: "/entries", icon: FileText },
  { name: "フォーム項目", href: "/form-fields", icon: FormInput },
  { name: "メールテンプレート", href: "/mail-templates", icon: Mail },
  { name: "CSV出力設定", href: "/csv-field-settings", icon: FileSpreadsheet },
  { name: "CAPTCHA設定", href: "/captcha-settings", icon: Shield },
];

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={cn("flex flex-col bg-white border-r transition-all duration-300", sidebarOpen ? "w-64" : "w-16")}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen && <span className="text-lg font-semibold">Form Manager</span>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User info & Logout */}
        <div className="border-t p-4">
          {sidebarOpen && <div className="mb-2 text-sm text-gray-600 truncate">{user.email}</div>}
          <Button variant="ghost" size={sidebarOpen ? "default" : "icon"} className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-2">ログアウト</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
