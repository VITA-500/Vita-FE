import type { ReactNode } from "react";
import { AdminAuthGate } from "@/features/admin/components/AdminAuthGate";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { ActionStatusProvider } from "@/features/admin/context/ActionStatusContext";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminAuthGate>
    <AdminDataProvider>
      <ActionStatusProvider>
        <AdminShell>{children}</AdminShell>
      </ActionStatusProvider>
    </AdminDataProvider>
  </AdminAuthGate>
);

export default AdminLayout;
