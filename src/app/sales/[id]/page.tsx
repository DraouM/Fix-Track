import { SaleDetailClient } from "@/components/clients/SaleDetailClient";

export async function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";
export const dynamicParams = false;

export default async function SaleDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <SaleDetailClient saleId={id} />;
}
