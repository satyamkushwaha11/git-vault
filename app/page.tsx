import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Landing from "@/components/Landing";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/vault");
  return <Landing />;
}
