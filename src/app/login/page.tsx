import { AuthLanding } from "@/components/auth-landing";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ banned?: string; underage?: string }>;
}) {
  const { banned, underage } = await searchParams;
  return <AuthLanding banned={banned === "1"} underage={underage === "1"} />;
}
