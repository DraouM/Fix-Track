import { ClientDetail } from "@/components/clients/ClientDetail";

export async function generateStaticParams() {
  return [];
}

export const dynamic = "force-static";
export const dynamicParams = false;

export default async function ClientDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <ClientDetail clientId={id} />;
}
