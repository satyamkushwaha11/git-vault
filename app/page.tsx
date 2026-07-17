import { auth } from "@/auth";
import Landing from "@/components/Landing";
import Vault from "@/components/Vault";
import { ToastProvider } from "@/components/Toast";

export default async function Home() {
  const session = await auth();

  if (!session?.user) return <Landing />;

  return (
    <ToastProvider>
      <Vault
        user={{ name: session.user.name, image: session.user.image }}
        token={session.accessToken}
      />
    </ToastProvider>
  );
}
