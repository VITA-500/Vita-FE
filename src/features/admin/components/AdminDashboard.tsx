"use client";

import { ChevronRight } from "lucide-react";
import { popularFaqTags } from "@/features/admin/constants/adminData";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { StatCard } from "@/shared/ui/StatCard";

export const AdminDashboard = () => {
  const { faqs, storeDetails, stores } = useAdminData();
  const activeFaqCount = faqs.filter((faq) => faq.status === "ACTIVE").length;
  const inactiveFaqCount = faqs.length - activeFaqCount;
  const storesWithConsultServices = storeDetails.filter(
    (store) => store.consultServices.length > 0,
  ).length;

  const recentFaqs = faqs
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const adminStats = [
    {
      label: "총 FAQ",
      value: faqs.length.toLocaleString("ko-KR"),
      helper: `활성 ${activeFaqCount.toLocaleString("ko-KR")}개`,
    },
    {
      label: "비활성 FAQ",
      value: inactiveFaqCount.toLocaleString("ko-KR"),
      helper: "검색/RAG 제외",
    },
    {
      label: "전체 매장 수",
      value: stores.length.toLocaleString("ko-KR"),
      helper: "관리자 매장 목록",
    },
    {
      label: "상담 가능 매장",
      value: storesWithConsultServices.toLocaleString("ko-KR"),
      helper: "consultServices 보유",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          대시보드
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          FAQ와 매장 현황을 한눈에 확인할 수 있습니다.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader
            title="최근 등록 FAQ"
            description="최근 관리 대상 FAQ를 확인하세요."
          />
          <CardContent>
            <div className="space-y-3">
              {recentFaqs.map((faq) => (
                <div
                  key={faq.faqId}
                  className="border-border-soft flex items-center justify-between rounded-xl border px-4 py-3 dark:border-white/10"
                >
                  <span className="min-w-0 truncate text-sm font-bold text-gray-700 dark:text-gray-200">
                    {faq.question}
                  </span>
                  <span className="ml-3 shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {faq.category}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="자주 묻는 키워드"
              description="최근 상담에서 많이 등장한 항목입니다."
            />
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularFaqTags.map((tag) => (
                  <span
                    key={tag}
                    className="border-brand/30 text-brand rounded-full border bg-white px-3 py-2 text-xs font-extrabold dark:bg-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="빠른 관리 바로가기" />
            <CardContent className="space-y-3">
              <ButtonLink
                href={routes.adminFaqs}
                variant="secondary"
                size="sm"
                fullWidth
                rightIcon={<ChevronRight size={16} />}
              >
                FAQ 관리
              </ButtonLink>
              <ButtonLink
                href={routes.adminStores}
                size="sm"
                fullWidth
                rightIcon={<ChevronRight size={16} />}
              >
                매장 관리
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
