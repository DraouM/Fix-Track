"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Package,
  Wrench,
  Settings,
  BarChart3,
  HelpCircle,
  Users,
  Calendar,
  FileText,
  LogOut,
  User,
  ChevronUp,
  Building2,
  ShoppingCart,
  PrinterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/",
    },
    {
      title: "Inventory",
      icon: Package,
      href: "/inventory",
    },
    {
      title: "Repairs",
      icon: Wrench,
      href: "/repairs",
    },
    {
      title: "Suppliers",
      icon: Building2,
      href: "/suppliers",
    },
    {
      title: "Shopping List",
      icon: ShoppingCart,
      href: "/shopping-list",
    },
    {
      title: "Customers",
      icon: Users,
      href: "/customers",
    },
    // {
    //   title: "Print",
    //   icon: PrinterIcon,
    //   href: "/print-settings",
    // },
    {
      title: "Orders",
      icon: FileText,
      href: "/orders",
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/reports",
    },
  ];

  const secondaryItems: NavItem[] = [
    {
      title: "Documentation",
      icon: FileText,
      href: "/docs",
      description: "View documentation",
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      href: "/help",
      description: "Get help",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      description: "App settings",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar
      variant="inset"
      className="fixed left-0 top-0 z-40 h-screen border-r-0 w-64 transition-all duration-300 ease-in-out data-[state=collapsed]:w-16"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center px-2 py-2">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
            <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-full">
              <Image
                src="/images/logo_1.png"
                alt="Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">FixTrack</span>
              <span className="truncate text-xs text-muted-foreground">
                Repair Management System
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                    className={
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    tooltip={item.description}
                    isActive={isActive(item.href)}
                    className={
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Status */}
        <SidebarGroup>
          <SidebarGroupLabel>System Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {/* Overall Status */}
              <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/50 p-2">
                <span className="text-xs font-medium group-data-[collapsible=icon]:hidden">
                  Status
                </span>
                <Badge
                  variant="default"
                  className="group-data-[collapsible=icon]:hidden"
                >
                  Active
                </Badge>
                <div
                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse group-data-[collapsible=icon]:block hidden"
                  title="System Active"
                ></div>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                    title="Database Online"
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    Database
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200 ml-auto group-data-[collapsible=icon]:hidden"
                >
                  Online
                </Badge>
              </div>

              {/* Server Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500"
                    title="Server Active"
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    Server
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-auto group-data-[collapsible=icon]:hidden"
                >
                  Active
                </Badge>
              </div>

              {/* Storage Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-orange-500"
                    title="Storage 78% Used"
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    Storage
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-50 text-orange-700 border-orange-200 ml-auto group-data-[collapsible=icon]:hidden"
                >
                  78%
                </Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/user.png" alt="User" />
                    <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">John Doe</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Admin
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatars/user.png" alt="User" />
                      <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">John Doe</span>
                      <span className="truncate text-xs text-muted-foreground">
                        Admin
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
