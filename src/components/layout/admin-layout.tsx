"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FormInput, Mail, FileSpreadsheet, Shield, LogOut, ChevronDown, ChevronRight, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { signOut } from "@/server/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
  };
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
      { name: "CSV出力設定", href: "/csv-field-settings", icon: FileSpreadsheet },
    ],
  },
  {
    name: "システム設定",
    items: [{ name: "CAPTCHA設定", href: "/captcha-settings", icon: Shield }],
  },
];

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(navigationGroups.map((g) => g.name));
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setExpandedGroups((prev) => (prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold">Form Manager</span>
          </Link>
        </div>

        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <span className="hidden text-sm font-medium md:inline-block">{user.name || user.email}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                設定
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col border-r bg-background">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="メニューを検索..."
                className="h-9 pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:inline-block">
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
                    onClick={() => toggleGroup(group.name)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground  hover:text-accent-foreground"
                  >
                    <span>{group.name}</span>
                    {expandedGroups.includes(group.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-accent-foreground"
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
            <p className="text-xs text-muted-foreground text-center">Form Manager v1.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
