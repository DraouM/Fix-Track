"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

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
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import i18n from "@/lib/i18n";

interface NavItem {
  titleKey: string;
  href: string;
  icon: React.ComponentType<any>;
  descriptionKey?: string;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      titleKey: "nav.dashboard",
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      titleKey: "nav.transactions",
      icon: Wallet,
      href: "/transactions",
    },
    {
      titleKey: "nav.inventory",
      icon: Package,
      href: "/inventory",
    },
    {
      titleKey: "nav.repairs",
      icon: Wrench,
      href: "/repairs",
    },
    {
      titleKey: "nav.clients",
      icon: Users,
      href: "/clients",
    },
    {
      titleKey: "nav.suppliers",
      icon: Building2,
      href: "/suppliers",
    },
    {
      titleKey: "nav.tasks",
      icon: Calendar,
      href: "/tasks",
    },
  ];

  const secondaryItems: NavItem[] = [
    {
      titleKey: "nav.documentation",
      icon: FileText,
      href: "/docs",
      descriptionKey: "nav.documentation",
    },
    {
      titleKey: "nav.helpSupport",
      icon: HelpCircle,
      href: "/help",
      descriptionKey: "nav.helpSupport",
    },
    {
      titleKey: "nav.settings",
      icon: Settings,
      href: "/settings",
      descriptionKey: "nav.settings",
    },
  ];

  // Keys for filtering navigation items
  const operationsKeys = ["nav.dashboard", "nav.transactions", "nav.inventory", "nav.repairs", "nav.tasks"];
  const managementKeys = ["nav.clients", "nav.suppliers"];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isRTL = i18n.language === "ar";

  return (
    <Sidebar
      side={isRTL ? "right" : "left"}
      variant="inset"
      className={cn(
        "fixed top-0 z-40 h-screen border-r-0 w-64 transition-all duration-300 ease-in-out data-[state=collapsed]:w-16",
        isRTL ? "right-0" : "left-0"
      )}
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
              <span className="truncate font-semibold">{t('app.name')}</span>
              <span className="truncate text-xs text-muted-foreground">
                {t('app.tagline')}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Operations Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.operations')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter((item) =>
                  operationsKeys.includes(item.titleKey)
                )
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      tooltip={t(item.titleKey)}
                      isActive={isActive(item.href)}
                      className={
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{t(item.titleKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter((item) => managementKeys.includes(item.titleKey))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      tooltip={t(item.titleKey)}
                      isActive={isActive(item.href)}
                      className={
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{t(item.titleKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.tools')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    tooltip={item.descriptionKey ? t(item.descriptionKey) : t(item.titleKey)}
                    isActive={isActive(item.href)}
                    className={
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{t(item.titleKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Status */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('system.status')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {/* Overall Status */}
              <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/50 p-2">
                <span className="text-xs font-medium group-data-[collapsible=icon]:hidden">
                  {t('common.status')}
                </span>
                <Badge
                  variant="default"
                  className="group-data-[collapsible=icon]:hidden"
                >
                  {t('status.active')}
                </Badge>
                <div
                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse group-data-[collapsible=icon]:block hidden"
                  title={t('status.active')}
                ></div>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                    title={`${t('system.database')} ${t('status.online')}`}
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {t('system.database')}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200 ml-auto group-data-[collapsible=icon]:hidden"
                >
                  {t('status.online')}
                </Badge>
              </div>

              {/* Server Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500"
                    title={`${t('system.server')} ${t('status.active')}`}
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {t('system.server')}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-auto group-data-[collapsible=icon]:hidden"
                >
                  {t('status.active')}
                </Badge>
              </div>

              {/* Storage Status */}
              <div className="flex items-center justify-center group-data-[collapsible=icon]:justify-center rounded-lg bg-sidebar-accent/30 p-2 border border-sidebar-border/50 hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:gap-0">
                  <div
                    className="w-2 h-2 rounded-full bg-orange-500"
                    title={`${t('system.storage')} 78%`}
                  ></div>
                  <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    {t('system.storage')}
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
                        {t('user.admin')}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  {t('user.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('user.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('user.signOut')}
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
