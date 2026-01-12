"use client";

import {
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FormInput,
  LogOut,
  Mail,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/auth/client";
import type { Organization } from "@/server/db/schema";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
  };
  organization?: Organization | null;
}

const navigationGroups = [
  {
    name: "コンテンツ管理",
    items: [{ name: "送信内容", href: "/entries", icon: FileText }],
  },
  {
    name: "フォーム設定",
    items: [
      { name: "フォーム項目", href: "/form-fields", icon: FormInput },
      { name: "メールテンプレート", href: "/mail-templates", icon: Mail },
      {
        name: "CSV出力設定",
        href: "/csv-field-settings",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    name: "システム設定",
    items: [{ name: "CAPTCHA設定", href: "/captcha-settings", icon: Shield }],
  },
];

export function AdminLayout({
  children,
  user,
  organization,
}: AdminLayoutProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    navigationGroups.map((g) => g.name),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const _menuId = useId();

  // クライアントサイドでマウントされたことを検知
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cmd+K (Mac) / Ctrl+K (Windows/Linux) で検索にフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName],
    );
  };

  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {organization ? organization.name : "Form Manager"}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <span className="hidden font-medium text-sm md:inline-block">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <span className="hidden font-medium text-sm md:inline-block">
                {user.name || user.email}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r bg-background">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="メニューを検索..."
                className="h-9 bg-muted/50 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-muted-foreground text-xs sm:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1 pb-4">
              {filteredGroups.map((group) => (
                <div key={group.name}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.name)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider hover:text-accent-foreground"
                  >
                    <span>{group.name}</span>
                    {expandedGroups.includes(group.name) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedGroups.includes(group.name) && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 font-medium text-sm transition-colors",
                              isActive
                                ? "bg-sidebar-primary/6 text-sidebar-primary"
                                : "text-muted-foreground hover:bg-sidebar-primary/6 hover:text-accent-foreground",
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="pt-0.5">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-3">
            <p className="text-center text-muted-foreground text-xs">
              Form Manager v1.0
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
