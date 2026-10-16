import { StoreManagement } from "@/features/admin/components/StoreManagement";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminPartnersPage = () => (
  <AdminDataProvider>
    <StoreManagement storeType="PARTNER" />
  </AdminDataProvider>
);

export default AdminPartnersPage;
