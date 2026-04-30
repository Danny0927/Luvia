import { useAccount } from "@/contexts/account";
import { Redirect } from "expo-router";

export default function IndexScreen() {
  const { hasAccount, hydrated } = useAccount();

  if (!hydrated) {
    return null;
  }

  if (!hasAccount) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
