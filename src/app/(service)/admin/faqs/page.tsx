import { FaqManagement } from "@/features/admin";
import { AdminDataProvider } from "@/features/admin";

const AdminFaqsPage = () => (
  <AdminDataProvider>
    <FaqManagement />
  </AdminDataProvider>
);

export default AdminFaqsPage;
