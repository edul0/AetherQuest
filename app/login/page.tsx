import LoginScreen from "@/src/components/auth/LoginScreen";

type LoginPageProps = {
  searchParams?: {
    next?: string;
    type?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginScreen nextPath={searchParams?.next || "/fichas"} recoveryType={searchParams?.type} />;
}
