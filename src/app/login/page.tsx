import { AuthLanding } from "@/components/auth-landing";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ banned?: string }>;
}) {
  const { banned } = await searchParams;
  return <AuthLanding banned={banned === "1"} />;
}
