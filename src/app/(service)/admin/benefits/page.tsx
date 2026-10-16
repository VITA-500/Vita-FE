import { redirect } from "next/navigation";
import { routes } from "@/shared/constants/routes";

const AdminBenefitsPage = () =>
  redirect(`${routes.adminPartners}?view=benefits`);

export default AdminBenefitsPage;
