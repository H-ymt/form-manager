"use client";

import {
  FileText,
  FormInput,
  Mail,
  FileSpreadsheet,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    navigationGroups.map((g) => g.name),
  );
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
    setExpandedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName],
    );
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
      items: group.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="">
      {/* Header */}
      <header className="">
        <div className="">
          <Link href="/" className="">
            <span className="">Form Manager</span>
          </Link>
        </div>

        <div className="">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="">
                <span className="">{user.name || user.email}</span>
                <ChevronDown className="" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="">
                <p className="">{user.name}</p>
                <p className="">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="" />
                設定
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="">
        {/* Sidebar */}
        <aside className="">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="メニューを検索..."
                className=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="">⌘K</kbd>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="">
            <nav className="">
              {filteredGroups.map((group) => (
                <div key={group.name}>
                  <button onClick={() => toggleGroup(group.name)} className="">
                    <span>{group.name}</span>
                    {expandedGroups.includes(group.name) ? (
                      <ChevronDown className="" />
                    ) : (
                      <ChevronRight className="" />
                    )}
                  </button>
                  {expandedGroups.includes(group.name) && (
                    <div className="">
                      {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn("", isActive ? "" : "")}
                          >
                            <item.icon className="" />
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
          <div className="">
            <p className="">Form Manager v1.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="">
          <div className="">{children}</div>
        </main>
      </div>
    </div>
  );
}
