"use client";

import { AlertTriangle, MessageSquareWarning } from "lucide-react";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import { routes } from "@/shared/constants/routes";
import { formatKoreanMonthDay } from "@/shared/lib/date";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { StatCard } from "@/shared/ui/StatCard";

type UnresolvedFaqCandidate = {
  count: number;
  failReason: "LOW_SIMILARITY" | "NO_MATCH" | "ANSWER_FAILED";
  id: number;
  lastOccurredAt: string;
  question: string;
  source: "CHAT" | "SEARCH";
};

const unresolvedFaqCandidates: UnresolvedFaqCandidate[] = [
  {
    id: 1,
    question: "해외에서 데이터가 갑자기 안 터질 때 바로 확인할 설정이 있나요?",
    source: "CHAT",
    failReason: "LOW_SIMILARITY",
    count: 18,
    lastOccurredAt: "2026-10-06T08:45:00",
  },
  {
    id: 2,
    question: "가족 결합 중 한 명만 알뜰폰으로 이동하면 할인은 어떻게 되나요?",
    source: "CHAT",
    failReason: "NO_MATCH",
    count: 11,
    lastOccurredAt: "2026-10-05T21:10:00",
  },
  {
    id: 3,
    question: "분실 신고 후 유심 재발급까지 대리점 방문 없이 가능한가요?",
    source: "SEARCH",
    failReason: "ANSWER_FAILED",
    count: 7,
    lastOccurredAt: "2026-10-05T18:32:00",
  },
];

const failReasonLabels: Record<UnresolvedFaqCandidate["failReason"], string> = {
  ANSWER_FAILED: "답변 실패",
  LOW_SIMILARITY: "유사도 낮음",
  NO_MATCH: "검색 결과 없음",
};

export const AdminDashboard = () => {
  const { storeDetails } = useAdminData();
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

  const unresolvedRepeatCount = unresolvedFaqCandidates.reduce(
    (sum, candidate) => sum + candidate.count,
    0,
  );
  const todayUnresolvedCount = unresolvedFaqCandidates.filter((candidate) =>
    candidate.lastOccurredAt.startsWith("2026-10-06"),
  ).length;

  const adminStats = [
    {
      label: "미해결 질문",
      value: unresolvedFaqCandidates.length.toLocaleString("ko-KR"),
      helper: "FAQ 등록 후보",
    },
    {
      label: "반복 문의",
      value: unresolvedRepeatCount.toLocaleString("ko-KR"),
      helper: "미해결 질문 누적 발생",
    },
    {
      label: "오늘 발생",
      value: todayUnresolvedCount.toLocaleString("ko-KR"),
      helper: "최근 미해결 질문",
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

      <section className="mt-8">
        <Card>
          <CardHeader
            title="미해결 질문 큐"
            description="반복되는 답변 실패 질문을 확인하고 FAQ로 전환합니다."
          />
          <CardContent>
            <div className="space-y-3">
              {unresolvedFaqCandidates.map((candidate) => (
                <UnresolvedQuestionRow
                  key={candidate.id}
                  candidate={candidate}
                />
              ))}
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

type UnresolvedQuestionRowProps = {
  candidate: UnresolvedFaqCandidate;
};

const UnresolvedQuestionRow = ({ candidate }: UnresolvedQuestionRowProps) => (
  <div className="border-border-soft grid gap-4 rounded-2xl border px-4 py-3 md:grid-cols-[1fr_92px_120px_92px_152px] md:items-center dark:border-white/10">
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2 md:hidden">
        <span className="bg-brand-soft text-brand rounded-full px-2.5 py-1 text-xs font-extrabold">
          {failReasonLabels[candidate.failReason]}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">
          {candidate.source}
        </span>
      </div>
      <p className="line-clamp-2 text-sm font-extrabold text-gray-800 dark:text-gray-100">
        {candidate.question}
      </p>
      <p className="mt-1 text-xs font-bold text-gray-400">
        출처 {candidate.source}
      </p>
    </div>

    <div className="text-brand flex items-center gap-1">
      <MessageSquareWarning size={17} />
      <span className="text-lg font-black">
        {candidate.count.toLocaleString("ko-KR")}
      </span>
      <span className="text-xs font-bold text-gray-400">회</span>
    </div>

    <span className="bg-brand-soft text-brand hidden w-fit rounded-full px-2.5 py-1 text-xs font-extrabold md:inline-flex">
      {failReasonLabels[candidate.failReason]}
    </span>

    <span className="text-xs font-bold text-gray-400">
      {formatKoreanMonthDay(candidate.lastOccurredAt)}
    </span>

    <div className="flex flex-wrap justify-end gap-2 md:flex-nowrap">
      <ButtonLink href={routes.adminFaqs} variant="secondary" size="xs">
        FAQ 등록
      </ButtonLink>
      <button
        type="button"
        className="h-8 rounded-2xl px-3 text-xs font-bold text-gray-400"
        disabled
      >
        무시
      </button>
    </div>
  </div>
);
