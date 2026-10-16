import { FaqManagement } from "@/features/admin/components/FaqManagement";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminFaqsPage = () => (
  <AdminDataProvider>
    <FaqManagement />
  </AdminDataProvider>
);

export default AdminFaqsPage;
