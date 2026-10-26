import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";

// Shared frame for every page except /login.
export default function AppLayout({ children }) {
  return (
    <AppShell>
      {children}
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </AppShell>
  );
}
