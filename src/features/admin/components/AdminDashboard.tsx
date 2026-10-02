"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import type { AdminFaqCategory } from "@/features/admin/types";
import { routes } from "@/shared/constants/routes";
import { formatKoreanMonthDay } from "@/shared/lib/date";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { StatCard } from "@/shared/ui/StatCard";

export const AdminDashboard = () => {
  const { faqTotalCount, faqs, storeDetails, storeTotalCount, stores } =
    useAdminData();
  const activeFaqCount = faqs.filter((faq) => faq.status === "ACTIVE").length;
  const inactiveFaqCount = faqs.filter(
    (faq) => faq.status === "INACTIVE",
  ).length;
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

  const recentFaqs = faqs
    .toSorted((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, 5);
  const recentStores = stores
    .toSorted((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, 5);
  const categoryCounts = faqs.reduce(
    (acc, faq) => {
      acc[faq.category] = (acc[faq.category] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<AdminFaqCategory, number>>,
  );
  const categoryRows = Object.entries(categoryCounts)
    .toSorted(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 6);
  const maxCategoryCount = Math.max(
    1,
    ...categoryRows.map(([, count]) => count),
  );

  const adminStats = [
    {
      label: "FAQ 관리 대상",
      value: faqTotalCount.toLocaleString("ko-KR"),
      helper: `현재 목록 ${faqs.length.toLocaleString("ko-KR")}개`,
    },
    {
      label: "활성 FAQ",
      value: activeFaqCount.toLocaleString("ko-KR"),
      helper:
        inactiveFaqCount > 0
          ? `비활성 ${inactiveFaqCount.toLocaleString("ko-KR")}개`
          : "현재 필터 기준",
    },
    {
      label: "대리점 관리 대상",
      value: storeTotalCount.toLocaleString("ko-KR"),
      helper: `현재 목록 ${stores.length.toLocaleString("ko-KR")}개`,
    },
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

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader
            title="데이터 품질 점검"
            description="고객 화면과 상담 품질에 바로 영향을 주는 누락 항목입니다."
          />
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="FAQ 카테고리 분포"
            description="특정 카테고리에 데이터가 몰려 있는지 확인합니다."
          />
          <CardContent className="space-y-3">
            {categoryRows.length === 0 ? (
              <p className="text-text-secondary py-8 text-center text-sm font-bold">
                표시할 FAQ 데이터가 없습니다.
              </p>
            ) : (
              categoryRows.map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-extrabold text-gray-700 dark:text-gray-200">
                      {category}
                    </span>
                    <span className="font-bold text-gray-400">{count}개</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10">
                    <div
                      className="bg-brand h-2 rounded-full"
                      style={{
                        width: `${Math.max(8, (count / maxCategoryCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="최근 등록 FAQ"
            description="방금 추가된 FAQ의 카테고리와 상태를 확인합니다."
            action={
              <ButtonLink
                href={routes.adminFaqs}
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight size={16} />}
              >
                FAQ 관리
              </ButtonLink>
            }
          />
          <CardContent>
            <RecentList
              emptyText="최근 등록 FAQ가 없습니다."
              rows={recentFaqs.map((faq) => ({
                id: `#${faq.faqId}`,
                meta: `${faq.category} · ${formatKoreanMonthDay(faq.createdAt)}`,
                title: faq.question,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="최근 등록 대리점"
            description="신규 대리점 데이터가 올바르게 들어왔는지 확인합니다."
            action={
              <ButtonLink
                href={routes.adminStores}
                size="sm"
                rightIcon={<ChevronRight size={16} />}
              >
                대리점 관리
              </ButtonLink>
            }
          />
          <CardContent>
            <RecentList
              emptyText="최근 등록 대리점이 없습니다."
              rows={recentStores.map((store) => ({
                id: `#${store.storeId}`,
                meta: `${formatKoreanMonthDay(store.createdAt)} · ${store.address}`,
                title: store.name,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-5">
        <Card>
          <CardHeader
            title="관리 바로가기"
            description="자주 쓰는 운영 화면으로 이동합니다."
          />
          <CardContent className="grid gap-3 sm:grid-cols-3">
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
              대리점 관리
            </ButtonLink>
            <ButtonLink
              href={routes.adminPartners}
              variant="secondary"
              size="sm"
              fullWidth
              rightIcon={<ChevronRight size={16} />}
            >
              제휴점 관리
            </ButtonLink>
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

type RecentListProps = {
  emptyText: string;
  rows: Array<{
    id: string;
    meta: string;
    title: string;
  }>;
};

const RecentList = ({ emptyText, rows }: RecentListProps) => {
  if (rows.length === 0) {
    return (
      <p className="text-text-secondary py-8 text-center text-sm font-bold">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="divide-border-soft divide-y dark:divide-white/10">
      {rows.map((row) => (
        <div
          key={`${row.id}-${row.title}`}
          className="py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-extrabold text-gray-800 dark:text-gray-100">
              {row.title}
            </p>
            <span className="shrink-0 text-xs font-bold text-gray-400">
              {row.id}
            </span>
          </div>
          <p className="text-text-secondary mt-1 truncate text-xs font-semibold">
            {row.meta}
          </p>
        </div>
      ))}
    </div>
  );
};
