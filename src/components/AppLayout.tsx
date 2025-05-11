
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Repairs', icon: <Icons.wrench className="h-5 w-5" /> },
  { href: '/inventory', label: 'Inventory', icon: <Icons.packageIcon className="h-5 w-5" /> },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen collapsible="icon">
      <div className="flex min-h-screen">
        <Sidebar side="left" variant="sidebar" className="flex flex-col">
          <SidebarHeader className="p-4 flex items-center justify-between">
             <Link href="/" className="flex items-center gap-2">
                {/* Replace with a proper logo if available */}
                <Icons.settings className="h-7 w-7 text-primary" /> 
                <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">FixTrack</h1>
            </Link>
            <div className="md:hidden"> {/* Show trigger only on mobile */}
                 <SidebarTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Icons.chevronDown /> {/* Using chevronDown as placeholder for menu icon */}
                    </Button>
                 </SidebarTrigger>
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto p-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={{children: item.label, side: 'right', align: 'center'}}
                    >
                      <a> {/* Link component needs an 'a' tag as child for legacyBehavior */}
                        {item.icon}
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          {/* SidebarFooter can be added here if needed */}
        </Sidebar>
        <SidebarInset className="flex-1 bg-background">
            <div className="p-4 md:p-6"> {/* Added padding to content area */}
                 {children}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
