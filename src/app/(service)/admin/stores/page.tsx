import { StoreManagement } from "@/features/admin/stores/components/StoreManagement";
import { AdminDataProvider } from "@/features/admin/common/context/AdminDataContext";

const AdminStoresPage = () => (
  <AdminDataProvider>
    <StoreManagement />
  </AdminDataProvider>
);

export default AdminStoresPage;
