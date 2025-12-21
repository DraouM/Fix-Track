"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, Clock, DollarSign, 
  History, ShoppingCart, Pencil, Trash2, ChevronLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientContext } from "@/context/ClientContext";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, getClientStatusBadgeVariant, getClientStatusDisplayText, getClientHistoryEventBadgeVariant } from "@/lib/clientUtils";
import { ClientForm } from "../ClientForm";
import { ClientPaymentModal } from "../ClientPaymentModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClientDetailProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const { clients, getClientHistory, deleteClient, loading } = useClientContext();
  const client = clients.find(c => c.id === clientId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (clientId) {
      getClientHistory(clientId);
    }
  }, [clientId, getClientHistory]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Client not found.</p>
        <Button variant="link" onClick={() => router.push("/clients")}>Back to Clients</Button>
      </div>
    );
  }

  const history = client.history || [];

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/clients")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <Badge variant={getClientStatusBadgeVariant(client.status) as any}>
              {getClientStatusDisplayText(client.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">ID: {client.id.slice(0, 8)} • Joined {formatDate(client.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm("Are you sure you want to delete this client?")) {
              deleteClient(client.id);
              router.push("/clients");
            }
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Contact and administrative information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{client.contactName || "None"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone || "None"}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email || "None"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium text-sm leading-tight">{client.address || "None"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-destructive">Financials</CardTitle>
            <CardDescription>Outstanding credit and balance</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center text-center py-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
            <h2 className={`text-4xl font-bold ${client.outstandingBalance > 0 ? "text-destructive" : "text-green-600"}`}>
              {formatCurrency(client.outstandingBalance)}
            </h2>
          </CardContent>
          <div className="p-6 pt-0">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setIsPaymentModalOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Sales
          </TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader className="py-4 px-6 border-b">
              <CardTitle className="text-lg">Recent History</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs font-medium">{formatDate(event.date)}</TableCell>
                      <TableCell>
                        <Badge variant={getClientHistoryEventBadgeVariant(event.type as any) as any} className="text-[10px] px-1.5 py-0">
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{event.notes}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        event.amount && event.amount > 0 ? "text-destructive" : "text-green-600"
                      }`}>
                        {event.amount !== undefined ? formatCurrency(Math.abs(event.amount)) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No activity history found for this client.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="sales" className="pt-4">
          <Card>
            <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
               <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
               <p>Sale tracking will appear here once implemented.</p>
               <Button variant="outline" className="mt-4" onClick={() => router.push("/sales/new")}>
                 Create New Sale
               </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the information for {client.name}.</DialogDescription>
          </DialogHeader>
          <ClientForm clientId={client.id} onSuccess={() => setIsEditModalOpen(false)} onCancel={() => setIsEditModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <ClientPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientId={client.id}
      />
    </div>
  );
}
