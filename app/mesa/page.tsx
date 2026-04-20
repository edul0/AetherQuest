import MesaClient from "@/src/components/vtt/MesaClient";

type MesaPageProps = {
  searchParams?: {
    convite?: string;
    invite?: string;
  };
};

export default function MesaPage({ searchParams }: MesaPageProps) {
  const inviteCode =
    typeof searchParams?.convite === "string"
      ? searchParams.convite
      : typeof searchParams?.invite === "string"
        ? searchParams.invite
        : undefined;

  return <MesaClient inviteCode={inviteCode} />;
}
