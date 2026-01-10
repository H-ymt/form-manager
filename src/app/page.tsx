import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/entries");
  } else {
    redirect("/login");
  }
}
