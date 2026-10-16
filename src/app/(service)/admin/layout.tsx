import type { ReactNode } from "react";
import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { ActionStatusProvider } from "@/features/admin/context/ActionStatusContext";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminAuthGate>
    <ActionStatusProvider>
      <AdminShell>{children}</AdminShell>
    </ActionStatusProvider>
  </AdminAuthGate>
);

export default AdminLayout;
