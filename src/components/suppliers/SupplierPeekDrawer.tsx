"use client";

import React from "react";
import type { Supplier } from "@/types/supplier";
import { EntityPeekDrawer } from "@/components/shared/EntityPeekDrawer";

export interface SupplierPeekDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  isLoading?: boolean;
  onRefresh: () => void;
  onOpenPayment?: () => void;
  onOpenFullPage?: () => void;
  onOpenLedger?: () => void;
}

export function SupplierPeekDrawer({
  isOpen,
  onClose,
  supplier,
  isLoading = false,
  onRefresh,
  onOpenPayment,
  onOpenFullPage,
  onOpenLedger,
}: SupplierPeekDrawerProps) {
  if (!supplier) return null;

  return (
    <EntityPeekDrawer
      mode="supplier"
      isOpen={isOpen}
      onClose={onClose}
      entityId={supplier.id}
      entityName={supplier.name}
      entityStatus={supplier.status}
      contactName={supplier.contactName}
      phone={supplier.phone}
      email={supplier.email}
      address={supplier.address}
      createdAt={supplier.createdAt}
      outstandingBalance={supplier.outstandingBalance || 0}
      transactions={[]}
      history={supplier.history || []}
      isLoading={isLoading}
      onRefresh={onRefresh}
      onOpenPayment={onOpenPayment}
      onOpenFullPage={onOpenFullPage}
      onOpenWindow={onOpenLedger}
    />
  );
}

export default SupplierPeekDrawer;
