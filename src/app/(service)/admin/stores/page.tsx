import { StoreManagement } from "@/features/admin/components/StoreManagement";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminStoresPage = () => (
  <AdminDataProvider>
    <StoreManagement />
  </AdminDataProvider>
);

export default AdminStoresPage;
