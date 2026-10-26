import type { ReactNode } from "react";
import { AdminAuthGate } from "@/features/admin";
import { AdminShell } from "@/features/admin";
import { ActionStatusProvider } from "@/features/admin";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminAuthGate>
    <ActionStatusProvider>
      <AdminShell>{children}</AdminShell>
    </ActionStatusProvider>
  </AdminAuthGate>
);

export default AdminLayout;
