"use client";

import { AlertTriangle } from "lucide-react";
import { AdminChatFeedbackContent } from "@/features/admin/components/AdminChatFeedbackContent";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import { useAdminChatStats } from "@/features/admin/context/useAdminChatStats";
import { getChatFeedbackStatItems } from "@/features/admin/lib/adminChatFeedbackStats";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { StatCard } from "@/shared/ui/StatCard";

/** 대시보드에는 많이 나온 답변 피드백 몇 개만 보여주고, 나머지는 답변 피드백 페이지에서 본다. */
const DASHBOARD_UNRESOLVED_LIMIT = 5;

export const AdminDashboard = () => {
  const { storeDetails } = useAdminData();
  const {
    error: chatStatsError,
    isLoading: isChatStatsLoading,
    stats: chatStats,
  } = useAdminChatStats(DASHBOARD_UNRESOLVED_LIMIT);
  const storesMissingPhone = storeDetails.filter(
    (store) => !store.phone?.trim(),
  );
  const storesMissingBusinessHours = storeDetails.filter(
    (store) => !store.businessHours?.trim(),
  );
  const storesMissingServices = storeDetails.filter(
    (store) =>
      store.consultServices.length === 0 && store.providedServices.length === 0,
  );
  const dataQualityIssueCount =
    storesMissingPhone.length +
    storesMissingBusinessHours.length +
    storesMissingServices.length;

  const adminStats = [
    ...getChatFeedbackStatItems(chatStats?.summary, isChatStatsLoading),
    {
      label: "데이터 점검",
      value: dataQualityIssueCount.toLocaleString("ko-KR"),
      helper: "전화번호/운영시간/서비스 누락",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          대시보드
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          운영자가 바로 확인해야 할 데이터 상태와 관리 작업을 모았습니다.
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

      <section className="mt-8">
        <Card>
          <CardHeader
            title="챗봇 답변 피드백"
            description="챗봇이 답하지 못했거나 아쉬워요를 받은 답변을 확인하고 FAQ로 보완합니다."
          />
          <CardContent>
            <AdminChatFeedbackContent
              error={chatStatsError}
              isLoading={isChatStatsLoading}
              stats={chatStats}
            />
            <div className="mt-4 flex justify-end">
              <ButtonLink
                href={routes.adminUnresolved}
                variant="secondary"
                size="xs"
              >
                답변 피드백 전체 보기
              </ButtonLink>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader
            title="데이터 품질 점검"
            description={
              dataQualityIssueCount > 0
                ? "고객 화면과 상담 품질에 바로 영향을 주는 누락 항목입니다."
                : "현재 확인된 필수 데이터 누락은 없습니다."
            }
          />
          <CardContent>
            {dataQualityIssueCount === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                점검할 누락 항목이 없습니다.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                <QualityRow
                  label="전화번호 누락"
                  count={storesMissingPhone.length}
                  description="전화 연결 버튼과 매장 상세 안내에 영향"
                />
                <QualityRow
                  label="운영시간 누락"
                  count={storesMissingBusinessHours.length}
                  description="방문 전 안내 정확도에 영향"
                />
                <QualityRow
                  label="서비스 정보 누락"
                  count={storesMissingServices.length}
                  description="상담 가능 업무와 제공 서비스 필터에 영향"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

type QualityRowProps = {
  count: number;
  description: string;
  label: string;
};

const QualityRow = ({ count, description, label }: QualityRowProps) => (
  <div className="border-border-soft flex items-center justify-between gap-4 rounded-xl border px-4 py-3 dark:border-white/10">
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {count > 0 && <AlertTriangle className="text-brand" size={16} />}
        <p className="font-extrabold text-gray-800 dark:text-gray-100">
          {label}
        </p>
      </div>
      <p className="text-text-secondary mt-1 text-xs font-semibold">
        {description}
      </p>
    </div>
    <span className="text-brand shrink-0 text-xl font-black">
      {count.toLocaleString("ko-KR")}
    </span>
  </div>
);
