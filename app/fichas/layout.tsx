import RequireAuth from "@/src/components/auth/RequireAuth";

export default function FichasLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
