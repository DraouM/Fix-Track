"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Wrench,
  Package,
  Wallet,
  Users,
  Printer,
  Database,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocSection {
  id: string;
  titleKey: string;
  icon: React.ComponentType<any>;
  description: string;
  topics: {
    title: string;
    content: string;
  }[];
}

export function DocsPage() {
  const { t } = useTranslation();
  const [activeSectionId, setActiveSectionId] = useState<string>("getting-started");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const sections: DocSection[] = [
    {
      id: "getting-started",
      titleKey: t("documentation.sections.gettingStarted") || "Getting Started",
      icon: Sparkles,
      description: "Overview of Fixary POS management system and initial workflow",
      topics: [
        {
          title: "Welcome to Fixary POS",
          content:
            "Fixary is a high-performance inventory and repair management system built with Next.js and Tauri. It offers offline-first SQLite database storage, transaction processing, repair tracking, stock inventory management, and thermal printer integration.",
        },
        {
          title: "Daily Sessions",
          content:
            "Start your day by initializing a cash session. Fixary tracks opening balances, withdrawals, transaction payments, and closing balances to ensure complete financial accuracy.",
        },
      ],
    },
    {
      id: "transactions",
      titleKey: t("documentation.sections.cashier") || "Transactions & Sales",
      icon: Wallet,
      description: "Managing sales, purchase orders, and payment history",
      topics: [
        {
          title: "New Sales & Purchases",
          content:
            "Create multi-tab workspaces for sales and purchase transactions. Search inventory by name or barcode, set line-item pricing and quantities, select clients or suppliers, and apply partial or full payments.",
        },
        {
          title: "Payment Processing",
          content:
            "Support for Cash, Credit Card, Bank Transfer, and Credit Account payments. All payment events automatically calculate balances and update client or supplier ledgers.",
        },
      ],
    },
    {
      id: "inventory",
      titleKey: t("documentation.sections.inventory") || "Inventory Management",
      icon: Package,
      description: "Stock levels, buying/selling prices, low stock alerts, and barcode support",
      topics: [
        {
          title: "Stock Tracking",
          content:
            "Manage item variants, phone brands, and part types. Set minimum stock thresholds to trigger automatic low-stock notifications on your dashboard.",
        },
        {
          title: "Barcode Integration",
          content:
            "Scan item barcodes directly in transactions or search inputs for rapid lookup and stock reduction.",
        },
      ],
    },
    {
      id: "repairs",
      titleKey: t("documentation.sections.repairs") || "Repair Tracking",
      icon: Wrench,
      description: "Repair tickets, status lifecycle, parts used, and repair billing",
      topics: [
        {
          title: "Repair Lifecycle",
          content:
            "Track repair tickets from Pending → In Progress → Completed → Delivered. Record device issues, models, estimated costs, and customer contact details.",
        },
        {
          title: "Parts & Payments",
          content:
            "Deduct parts used directly from inventory and attach them to repair records. Add partial payments as work progresses; repair payment status updates automatically.",
        },
      ],
    },
    {
      id: "printing",
      titleKey: t("documentation.sections.printing") || "Printing & Receipts",
      icon: Printer,
      description: "Thermal receipt printing, sticker labels, and printer configuration",
      topics: [
        {
          title: "Printer Setup",
          content:
            "Fixary supports direct USB thermal printing (ESC/POS) and sticker printing. Printers are automatically detected by the system and can be configured in Settings.",
        },
        {
          title: "Direct Printing",
          content:
            "Print customer receipts and barcode repair stickers directly from the transaction or repair completion workflow without requiring browser print dialogs.",
        },
      ],
    },
    {
      id: "database",
      titleKey: t("documentation.sections.database") || "Database Architecture",
      icon: Database,
      description: "Local SQLite database storage, WAL mode, and data security",
      topics: [
        {
          title: "Local Database Storage",
          content:
            "Your data remains 100% private and stored locally in an optimized SQLite database file (`fixary.db`) running with Write-Ahead Logging (WAL) for maximum concurrency and reliability.",
        },
        {
          title: "Backups & Security",
          content:
            "You can back up your SQLite database file at any time from Settings or by copying the `fixary.db` file in your application data directory.",
        },
      ],
    },
  ];

  const filteredSections = sections
    .map((section) => {
      if (!searchTerm.trim()) return section;
      const matchesTitle = section.titleKey.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDescription = section.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchingTopics = section.topics.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchesTitle || matchesDescription || matchingTopics.length > 0) {
        return {
          ...section,
          topics: matchingTopics.length > 0 ? matchingTopics : section.topics,
        };
      }
      return null;
    })
    .filter(Boolean) as DocSection[];

  const currentSection =
    filteredSections.find((s) => s.id === activeSectionId) || filteredSections[0] || sections[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            {t("documentation.title") || "Documentation & User Guide"}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t("documentation.subtitle") || "Comprehensive documentation and technical reference for Fixary"}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("documentation.search") || "Search documentation..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 px-2">
            Sections
          </p>
          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection?.id === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all flex items-start gap-4 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.01]"
                    : "bg-card hover:bg-accent border-slate-200 dark:border-slate-800 text-card-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2.5 rounded-xl flex items-center justify-center shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base flex items-center justify-between">
                    {section.titleKey}
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "rotate-90 text-white" : "text-muted-foreground"
                      )}
                    />
                  </h3>
                  <p
                    className={cn(
                      "text-xs line-clamp-1 mt-0.5 font-normal",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {section.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-8">
          {currentSection ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 font-bold text-xs uppercase">
                      {currentSection.titleKey}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black mt-2">
                    {currentSection.titleKey}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {currentSection.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {currentSection.topics.map((topic, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black">
                          {idx + 1}
                        </span>
                        {topic.title}
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed pl-8 font-normal">
                        {topic.content}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground font-medium">
                No matching documentation topics found for "{searchTerm}".
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
