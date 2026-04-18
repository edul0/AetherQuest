import MesaClient from "@/src/components/vtt/MesaClient";
import RequireAuth from "@/src/components/auth/RequireAuth";

export default function MesaPage() {
  return (
    <RequireAuth>
      <MesaClient />
    </RequireAuth>
  );
}
