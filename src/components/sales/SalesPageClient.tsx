
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useClientContext } from '@/context/ClientContext';
import { useInventoryContext } from '@/context/InventoryContext';
import type { Client } from '@/types/client';
import type { InventoryItem } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
  sellingPrice: number; // Price at the time of adding to cart
}

export default function SalesPageClient() {
  const { clients } = useClientContext();
  const { inventoryItems, getItemById, updateItemQuantity: updateInventoryContextItemQuantity } = useInventoryContext();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryPopoverOpen, setInventoryPopoverOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const availableInventoryItems = useMemo(() => {
    return inventoryItems.filter(item => 
      item.itemName.toLowerCase().includes(inventorySearchTerm.toLowerCase()) &&
      (item.quantityInStock ?? 0) > 0 &&
      !cartItems.some(cartItem => cartItem.inventoryItem.id === item.id) // Exclude items already in cart
    );
  }, [inventoryItems, inventorySearchTerm, cartItems]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientPopoverOpen(false);
  };

  const handleAddInventoryItemToCart = (item: InventoryItem) => {
    if ((item.quantityInStock ?? 0) <= 0) {
      toast({ title: "Out of Stock", description: `${item.itemName} is currently out of stock.`, variant: "destructive" });
      return;
    }
    setCartItems(prev => {
      const existingItem = prev.find(ci => ci.inventoryItem.id === item.id);
      if (existingItem) {
        // This case should ideally not be hit if availableInventoryItems filters correctly
        return prev.map(ci => 
          ci.inventoryItem.id === item.id 
          ? { ...ci, quantity: Math.min(ci.quantity + 1, item.quantityInStock ?? 1) } 
          : ci
        );
      }
      return [...prev, { inventoryItem: item, quantity: 1, sellingPrice: item.sellingPrice }];
    });
    setInventorySearchTerm('');
    setInventoryPopoverOpen(false);
  };

  const handleUpdateCartItemQuantity = (itemId: string, newQuantityStr: string) => {
    let newQuantity = parseInt(newQuantityStr, 10);
    const itemInCart = cartItems.find(ci => ci.inventoryItem.id === itemId);
    const inventoryItem = getItemById(itemId);

    if (!itemInCart || !inventoryItem) return;

    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    
    const maxQuantity = inventoryItem.quantityInStock ?? 0;
    if (newQuantity > maxQuantity) {
      newQuantity = maxQuantity;
      toast({ title: "Stock Limit Reached", description: `Only ${maxQuantity} units of ${inventoryItem.itemName} available.`, variant: "destructive" });
    }
    
    if (maxQuantity === 0 && newQuantity > 0) { // Should not happen if item is removed when stock is 0 after adding
        toast({ title: "Out of Stock", description: `${inventoryItem.itemName} is out of stock.`, variant: "destructive" });
        setCartItems(prev => prev.filter(ci => ci.inventoryItem.id !== itemId));
        return;
    }


    setCartItems(prev => prev.map(ci => 
      ci.inventoryItem.id === itemId ? { ...ci, quantity: newQuantity } : ci
    ));
  };

  const handleRemoveItemFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(ci => ci.inventoryItem.id !== itemId));
  };

  const saleTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
  }, [cartItems]);

  const handleFinalizeSale = () => {
    if (!selectedClient) {
      toast({ title: "Client Required", description: "Please select a client for the sale.", variant: "destructive" });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart before finalizing.", variant: "destructive" });
      return;
    }

    // In a real scenario:
    // 1. Create a sale record in database/context
    // 2. Update inventory quantities (deduct stock)
    // 3. Update client debt if applicable
    // 4. Potentially generate an invoice

    console.log("Finalizing Sale...");
    console.log("Client:", selectedClient);
    console.log("Cart Items:", cartItems.map(item => ({ 
        id: item.inventoryItem.id, 
        name: item.inventoryItem.itemName, 
        quantity: item.quantity, 
        price: item.sellingPrice 
    })));
    console.log("Sale Total:", saleTotal);

    // Example of updating inventory (this should be more robust, possibly transactional)
    // cartItems.forEach(item => {
    //   updateInventoryContextItemQuantity(item.inventoryItem.id, -item.quantity);
    // });

    toast({ title: "Sale Logged (Placeholder)", description: `Sale for ${selectedClient.name} totaling $${saleTotal.toFixed(2)} logged to console.` });
    
    // Reset for next sale
    // setSelectedClient(null);
    // setCartItems([]);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Create New Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sale Details</CardTitle>
            <CardDescription>Select a client and add items to the cart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
            <div>
              <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Client
              </label>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientPopoverOpen}
                    className="w-full justify-between"
                    id="client-select"
                  >
                    {selectedClient ? selectedClient.name : "Select client..."}
                    <Icons.chevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search client..." />
                    <CommandList>
                      <CommandEmpty>No client found.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => handleClientSelect(client)}
                          >
                            <Icons.check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {client.name} ({client.phoneNumber || 'No phone'})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Inventory Item Selection */}
            <div>
              <label htmlFor="inventory-search" className="block text-sm font-medium text-gray-700 mb-1">
                Add Item to Cart
              </label>
              <Popover open={inventoryPopoverOpen} onOpenChange={setInventoryPopoverOpen}>
                <PopoverTrigger asChild>
                   <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {inventorySearchTerm || "Search products..."}
                    <Icons.search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput 
                      id="inventory-search"
                      placeholder="Search inventory by name..."
                      value={inventorySearchTerm}
                      onValueChange={setInventorySearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>No items found, or item already in cart / out of stock.</CommandEmpty>
                      <CommandGroup>
                        {availableInventoryItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.itemName}
                            onSelect={() => handleAddInventoryItemToCart(item)}
                            disabled={(item.quantityInStock ?? 0) <= 0}
                          >
                            {item.itemName} (Stock: {item.quantityInStock ?? 0}) - ${item.sellingPrice.toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <Separator />

            {/* Shopping Cart Table */}
            <div>
              <h3 className="text-lg font-medium mb-2">Shopping Cart</h3>
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty.</p>
              ) : (
                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-[80px] text-center">Qty</TableHead>
                        <TableHead className="text-right w-[100px]">Price</TableHead>
                        <TableHead className="text-right w-[100px]">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((cartItem) => (
                        <TableRow key={cartItem.inventoryItem.id}>
                          <TableCell>{cartItem.inventoryItem.itemName}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={cartItem.quantity.toString()}
                              onChange={(e) => handleUpdateCartItemQuantity(cartItem.inventoryItem.id, e.target.value)}
                              min="1"
                              max={getItemById(cartItem.inventoryItem.id)?.quantityInStock?.toString() ?? "1"}
                              className="w-16 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell className="text-right">${cartItem.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(cartItem.sellingPrice * cartItem.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromCart(cartItem.inventoryItem.id)} className="h-8 w-8">
                              <Icons.trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary Card */}
        <Card className="lg:col-span-1 sticky top-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedClient && (
              <div className="text-sm">
                <p className="font-medium">Client:</p>
                <p>{selectedClient.name}</p>
                <p>{selectedClient.phoneNumber}</p>
              </div>
            )}
            {!selectedClient && <p className="text-sm text-muted-foreground">No client selected.</p>}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>${saleTotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleFinalizeSale}
              disabled={!selectedClient || cartItems.length === 0}
            >
              <Icons.check className="mr-2 h-4 w-4" />
              Finalize Sale (Log to Console)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
