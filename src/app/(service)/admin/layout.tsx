import type { ReactNode } from "react";
import { AdminAuthGate } from "@/features/admin/common/components/AdminAuthGate";
import { AdminShell } from "@/features/admin/common/components/AdminShell";
import { ActionStatusProvider } from "@/features/admin/common/context/ActionStatusContext";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminAuthGate>
    <ActionStatusProvider>
      <AdminShell>{children}</AdminShell>
    </ActionStatusProvider>
  </AdminAuthGate>
);

export default AdminLayout;
