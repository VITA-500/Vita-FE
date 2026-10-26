import { PartnerManagement } from "@/features/admin";
import { AdminDataProvider } from "@/features/admin";

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
