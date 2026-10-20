import { PartnerManagement } from "@/features/admin/partners/components/PartnerManagement";
import { AdminDataProvider } from "@/features/admin/common/context/AdminDataContext";

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
