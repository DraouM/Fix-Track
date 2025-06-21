
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryForm } from './InventoryForm';
import { InventoryTable } from './InventoryTable';
import { InventoryHistoryDialog } from './InventoryHistoryDialog'; // Import the new dialog
import { useInventoryContext } from '@/context/InventoryContext';
import { Icons } from '@/components/icons';
import type { InventoryItem, PhoneBrand, ItemType, InventoryFormValues } from '@/types/inventory';
import { PHONE_BRANDS, ITEM_TYPES } from '@/types/inventory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


function InventoryPageContent() {
  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, loading, getItemById } = useInventoryContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<PhoneBrand>('All');
  const [selectedType, setSelectedType] = useState<ItemType>('All');

  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem | 'profit'; direction: 'ascending' | 'descending' } | null>({ key: 'itemName', direction: 'ascending' });

  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null); // State for history dialog


  const sortedAndFilteredItems = useMemo(() => {
    let sortableItems = [...inventoryItems]
      .filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((item) =>
        selectedBrand === 'All' ? true : item.phoneBrand === selectedBrand
      )
      .filter((item) =>
        selectedType === 'All' ? true : item.itemType === selectedType
      );
      
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        // Handle special 'profit' key
        if (sortConfig.key === 'profit') {
          aValue = a.sellingPrice - a.buyingPrice;
          bValue = b.sellingPrice - b.buyingPrice;
        } else {
          aValue = a[sortConfig.key as keyof Omit<InventoryItem, 'history'>];
          bValue = b[sortConfig.key as keyof Omit<InventoryItem, 'history'>];
        }
        
        // Handle optional quantityInStock by providing a default value for sorting
        if (sortConfig.key === 'quantityInStock') {
            aValue = a.quantityInStock ?? -Infinity;
            bValue = b.quantityInStock ?? -Infinity;
        }
        
        // Ensure values are comparable
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [inventoryItems, searchTerm, selectedBrand, selectedType, sortConfig]);

  const handleEdit = useCallback((item: InventoryItem) => {
    const fullItem = getItemById(item.id); // Get the most up-to-date item
    if (fullItem) {
        setItemToEdit(fullItem);
        setIsFormOpen(true);
    }
  }, [getItemById]);

  const handleDeleteConfirmation = useCallback((itemId: string) => {
    setItemToDeleteId(itemId);
  }, []);

  const handleDelete = useCallback(() => {
    if (itemToDeleteId) {
      deleteInventoryItem(itemToDeleteId);
      setItemToDeleteId(null); // Close dialog
    }
  }, [itemToDeleteId, deleteInventoryItem]);

  const handleViewHistory = useCallback((item: InventoryItem) => {
    const fullItem = getItemById(item.id);
    if(fullItem) {
      setHistoryItem(fullItem);
    }
  }, [getItemById]);

  const handleSort = useCallback((key: keyof InventoryItem | 'profit') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);


  const handleFormSubmit = (data: InventoryFormValues) => {
    if (itemToEdit) {
      updateInventoryItem(itemToEdit.id, data);
    } else {
      addInventoryItem(data);
    }
    setIsFormOpen(false);
    setItemToEdit(null);
  };

  const openAddNewForm = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icons.spinner className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setItemToEdit(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAddNewForm}>
              <Icons.plusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>{itemToEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>
                {itemToEdit ? 'Update the details of this inventory item.' : 'Fill in the details to add a new item to your inventory.'}
              </DialogDescription>
            </DialogHeader>
            <InventoryForm 
              onSuccess={() => setIsFormOpen(false)} 
              itemToEdit={itemToEdit}
              onSubmitForm={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
            aria-label="Search items"
          />
          <div className="space-y-1">
            <label htmlFor="brand-filter" className="text-sm font-medium text-muted-foreground">Filter by Brand</label>
            <Select value={selectedBrand} onValueChange={(value) => setSelectedBrand(value as PhoneBrand)}>
              <SelectTrigger id="brand-filter">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                {PHONE_BRANDS.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="type-filter" className="text-sm font-medium text-muted-foreground">Filter by Type</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ItemType)}>
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <InventoryTable 
        items={sortedAndFilteredItems} 
        onEdit={handleEdit} 
        onDelete={handleDeleteConfirmation} 
        onViewHistory={handleViewHistory}
        onSort={handleSort}
        sortConfig={sortConfig}
      />

      {historyItem && <InventoryHistoryDialog item={historyItem} onClose={() => setHistoryItem(null)} />}

      <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              from your inventory and its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InventoryPageClient() {
  return (
      <InventoryPageContent />
  );
}
