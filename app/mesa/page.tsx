import MesaClient from "@/src/components/vtt/MesaClient";

type MesaPageProps = {
  searchParams?: {
    convite?: string;
  };
};

export default function MesaPage({ searchParams }: MesaPageProps) {
  const inviteCode = typeof searchParams?.convite === "string" ? searchParams.convite : undefined;

  return <MesaClient inviteCode={inviteCode} />;
}
