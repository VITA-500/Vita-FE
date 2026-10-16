import { PartnerManagement } from "@/features/admin/components/PartnerManagement";
import { AdminDataProvider } from "@/features/admin/context/AdminDataContext";

const AdminPartnersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) => {
  const { view } = await searchParams;
  return (
    <AdminDataProvider>
      <PartnerManagement
        initialView={view === "benefits" ? "benefits" : "stores"}
      />
    </AdminDataProvider>
  );
};

export default AdminPartnersPage;
