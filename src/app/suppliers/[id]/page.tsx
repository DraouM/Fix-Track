import { SupplierDetail } from "@/components/suppliers/SupplierDetail";

export async function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";
export const dynamicParams = false;

export default async function SupplierDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <SupplierDetail supplierId={id} />;
}
