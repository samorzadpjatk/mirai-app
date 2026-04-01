import { Redirect } from "expo-router";
import { useAuth } from "@mirai-app/auth/client";

export default function AdminLayout() {
  const { user } = useAuth();
  const hasAdminAccess = user?.role === "ADMIN" || user?.role === "MODERATOR";

  if (hasAdminAccess) {
    return <Redirect href="/profile/admin-web" />;
  }

  return <Redirect href="/profile" />;
}
