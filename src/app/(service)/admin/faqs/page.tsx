import { FaqManagement } from "@/features/admin/faq/components/FaqManagement";
import { AdminDataProvider } from "@/features/admin/common/context/AdminDataContext";

const AdminFaqsPage = () => (
  <AdminDataProvider>
    <FaqManagement />
  </AdminDataProvider>
);

export default AdminFaqsPage;
