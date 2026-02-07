"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Book,
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Printer,
  Database,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function DocumentationPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const sections = [
    {
      id: "getting-started",
      title: t("documentation.sections.gettingStarted"),
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{t("documentation.content.gettingStarted.title")}</h1>
            <p className="text-lg text-muted-foreground">
              {t("documentation.content.gettingStarted.intro")}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border p-4 bg-card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                {t("documentation.content.gettingStarted.features")}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Unified Cashier Dashboard</li>
                <li>Real-time Analytics</li>
                <li>Inventory Tracking</li>
                <li>Repair Management</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4 bg-card">
              <h3 className="font-semibold mb-2">
                {t("documentation.content.gettingStarted.sessions")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("documentation.content.gettingStarted.sessionsDesc")}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "dashboard",
      title: t("documentation.sections.dashboard"),
      icon: LayoutDashboard,
      content: (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold">{t("documentation.sections.dashboard")}</h2>
           <p className="text-muted-foreground">
             The dashboard serves as the central hub for your business operations.
           </p>
           <div className="space-y-4">
             <div className="border-l-4 border-primary pl-4">
               <h3 className="font-medium">Metrics Overview</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 View total revenue, profit trends, and active repair counts at a glance.
               </p>
             </div>
             <div className="border-l-4 border-primary pl-4">
               <h3 className="font-medium">Quick Actions</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 Immediately start a new sale, repair, or add inventory items directly from the dashboard.
               </p>
             </div>
           </div>
        </div>
      )
    },
    {
      id: "inventory",
      title: t("documentation.sections.inventory"),
      icon: Package,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t("documentation.sections.inventory")}</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Manage your stock efficiently with real-time tracking and low-stock alerts.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
               <div className="p-4 rounded-md border bg-muted/50">
                 <h4 className="font-medium mb-1">Item Tracking</h4>
                 <p className="text-xs text-muted-foreground">Track quantities, buying/selling prices, and supplier info.</p>
               </div>
               <div className="p-4 rounded-md border bg-muted/50">
                 <h4 className="font-medium mb-1">Low Stock Alerts</h4>
                 <p className="text-xs text-muted-foreground">Automatic notifications when items fall below defined thresholds.</p>
               </div>
               <div className="p-4 rounded-md border bg-muted/50">
                 <h4 className="font-medium mb-1">Barcode Support</h4>
                 <p className="text-xs text-muted-foreground">Scan items to quickly add them to sales or look up details.</p>
               </div>
            </div>
          </div>
        </div>
      )
    },
     {
      id: "repairs",
      title: t("documentation.sections.repairs"),
      icon: Wrench,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t("documentation.sections.repairs")}</h2>
          <p className="text-muted-foreground">
             Comprehensive workflow for managing device repairs from intake to delivery.
          </p>
          
          <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3">Status Workflow</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Pending</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">In Progress</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge className="bg-green-500">Completed</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Delivered</Badge>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Features</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Customer & Device details recording</li>
                    <li>Parts consumption tracking</li>
                    <li>Payment status management (partial/full)</li>
                    <li>Printable repair tickets and receipts</li>
                </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "printing",
      title: t("documentation.sections.printing"),
      icon: Printer,
      content: (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold">{t("documentation.content.printing.title")}</h2>
           <p className="text-muted-foreground">{t("documentation.content.printing.desc")}</p>
           
           <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
             <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                {t("documentation.content.printing.setup")}
             </h3>
             <pre className="text-sm whitespace-pre-wrap font-mono text-yellow-700 dark:text-yellow-300">
               {t("documentation.content.printing.setupSteps")}
             </pre>
           </div>
        </div>
      )
    },
    {
      id: "database",
      title: t("documentation.sections.database"),
      icon: Database,
      content: (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold">{t("documentation.content.database.title")}</h2>
           <p className="text-muted-foreground">{t("documentation.content.database.desc")}</p>
           
           <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                    <span className="text-sm font-semibold block mb-2">Core Entities</span>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>Clients (Customers)</li>
                        <li>Repairs (Jobs)</li>
                        <li>Inventory (Stock)</li>
                        <li>Sales (Transactions)</li>
                    </ul>
                </div>
                <div className="rounded-lg border p-4">
                     <span className="text-sm font-semibold block mb-2">{t("documentation.content.database.backup")}</span>
                     <p className="text-sm text-muted-foreground">
                        {t("documentation.content.database.backupDesc")}
                     </p>
                </div>
             </div>
           </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 border-r bg-muted/30 lg:block flex-shrink-0">
        <div className="p-4 border-b">
            <h2 className="font-semibold text-lg flex items-center gap-2">
                <Book className="h-5 w-5" />
                Docs
            </h2>
        </div>
        <div className="p-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("documentation.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <ScrollArea className="h-[calc(100vh-140px)]">
            <nav className="space-y-1 px-2">
                {filteredSections.map((section) => (
                    <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-2",
                            activeSection === section.id && "bg-secondary font-medium"
                        )}
                        onClick={() => setActiveSection(section.id)}
                    >
                        <section.icon className="h-4 w-4" />
                        {section.title}
                    </Button>
                ))}
            </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden border-b p-4 flex items-center gap-4 bg-background">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <Book className="h-5 w-5" />
                            Docs
                        </h2>
                    </div>
                    <ScrollArea className="h-[calc(100vh-60px)] p-4">
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <Button
                                    key={section.id}
                                    variant={activeSection === section.id ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-2"
                                    onClick={() => setActiveSection(section.id)}
                                >
                                    <section.icon className="h-4 w-4" />
                                    {section.title}
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
            <h1 className="font-semibold text-lg">Documentation</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-10">
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {sections.find(s => s.id === activeSection)?.content}
            </div>
        </main>
      </div>
    </div>
  );
}
