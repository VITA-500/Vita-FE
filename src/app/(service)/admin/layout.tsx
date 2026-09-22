import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { ActionStatusProvider } from "@/features/admin/context/ActionStatusContext";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminLayout = ({ children }: { children: ReactNode }) => (
  <AdminDataProvider>
    <ActionStatusProvider>
      <AdminShell>{children}</AdminShell>
    </ActionStatusProvider>
  </AdminDataProvider>
);

export default AdminLayout;
