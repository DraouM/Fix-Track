import { SaleDetailClient } from "@/components/clients/SaleDetailClient";

export default async function SaleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <SaleDetailClient saleId={id} />;
}
