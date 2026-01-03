"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCcw, 
  Download, 
  UserPlus,
  CreditCard,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientContext } from "@/context/ClientContext";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientTable } from "./ClientTable";
import { ClientForm } from "./ClientForm";
import { ClientPaymentModal } from "./ClientPaymentModal";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "../ui/select";
import { formatCurrency } from "@/lib/clientUtils";

export default function ClientPageClient() {
  const { clients, loading, fetchClients } = useClientContext();
  const { 
    filteredAndSortedClients, 
    searchTerm, 
    setSearchTerm, 
    setActiveFilter, 
    activeFilter,
    clearFilters
  } = useClientFilters(clients);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const totalOutstanding = clients.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const activeClients = clients.filter(c => c.status === "active").length;

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "orange" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      orange: "bg-orange-50 text-orange-600",
      red: "bg-red-50 text-red-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</span>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-foreground">{value}</div>
          {subtitle && (
            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70">
              <div className={`h-1 w-1 rounded-full ${colorClasses[color].replace('text-', 'bg-')}`}></div>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Clients
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                Customer Base & Credit Management
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fetchClients()}
              disabled={loading}
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-3xl border-none shadow-2xl">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="text-xl font-black">Add New Client</DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground">
                    Enter the details for the new client record.
                  </DialogDescription>
                </DialogHeader>
                <div className="pt-4">
                  <ClientForm onSuccess={() => setIsAddModalOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Clients"
            value={clients.length}
            subtitle={`${activeClients} active accounts`}
            color="blue"
          />
          <StatCard
            icon={CreditCard}
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            subtitle="Extended credit"
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            title="Avg. Balance"
            value={clients.length > 0 ? formatCurrency(totalOutstanding / clients.length) : formatCurrency(0)}
            subtitle="Per client average"
            color="green"
          />
          <StatCard
            icon={CheckCircle2}
            title="Active"
            value={activeClients}
            subtitle="Regular customers"
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 relative w-full">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">Search Directory</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary/20 transition-all text-sm font-bold placeholder:font-medium"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-[200px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">Account Status</span>
              <Select
                value={activeFilter === "All" ? "all" : activeFilter ? "active" : "inactive"}
                onValueChange={(v) => setActiveFilter(v === "all" ? "All" : v === "active")}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold text-xs uppercase py-2.5">All Accounts</SelectItem>
                  <SelectItem value="active" className="font-bold text-xs uppercase py-2.5">Active Only</SelectItem>
                  <SelectItem value="inactive" className="font-bold text-xs uppercase py-2.5">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchTerm !== "" || activeFilter !== "All") && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <ClientTable 
            clients={filteredAndSortedClients} 
            loading={loading}
            onRecordPayment={(id) => {
              setSelectedClientId(id);
              setIsPaymentModalOpen(true);
            }}
          />
        </div>

        <ClientPaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          clientId={selectedClientId}
        />
      </div>
    </div>
  );
}
