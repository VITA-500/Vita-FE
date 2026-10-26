import { StoreManagement } from "@/features/admin";
import { AdminDataProvider } from "@/features/admin";

const AdminStoresPage = () => (
  <AdminDataProvider>
    <StoreManagement />
  </AdminDataProvider>
);

export default AdminStoresPage;
