"use client";

import React, { useState } from "react";
import { User, Plus, Calendar, ShoppingCart as CartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClientContext } from "@/context/ClientContext";
import { formatCurrency } from "@/lib/clientUtils";
import type { Client } from "@/types/client";

interface EnhancedClientSelectorProps {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

export function EnhancedClientSelector({
  selectedClientId,
  setSelectedClientId,
}: EnhancedClientSelectorProps) {
  const { clients } = useClientContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleAddClient = () => {
    // This would typically call an API to create a new client
    // For now, just reset the form and hide it
    setNewClientName("");
    setNewClientEmail("");
    setShowAddForm(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!showAddForm ? (
          <>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Select a Customer...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}{" "}
                  {client.outstandingBalance > 0
                    ? `(Bal: ${formatCurrency(client.outstandingBalance)})`
                    : ""}
                </option>
              ))}
            </select>
            <Button
              variant="link"
              className="p-0 mt-2 h-auto text-xs"
              onClick={() => setShowAddForm(true)}
            >
              + Add new customer
            </Button>

            {selectedClient && (
              <div className="mt-4 p-3 rounded-md bg-muted/40 border space-y-2">
                {selectedClient.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CartIcon className="h-3 w-3" /> {selectedClient.email}
                  </p>
                )}
                {selectedClient.outstandingBalance &&
                  selectedClient.outstandingBalance > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        Outstanding Balance:
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {formatCurrency(selectedClient.outstandingBalance)}
                      </Badge>
                    </div>
                  )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                type="text"
                placeholder="Enter customer name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email (Optional)</label>
              <Input
                type="email"
                placeholder="Enter customer email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" size="sm" onClick={handleAddClient}>
                Add Customer
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
