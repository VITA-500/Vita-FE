"use client";

import { AdminChatFeedbackContent } from "@/features/admin/components/AdminChatFeedbackContent";
import { useAdminChatStats } from "@/features/admin/context/useAdminChatStats";
import { getChatFeedbackStatItems } from "@/features/admin/lib/adminChatFeedbackStats";
import { ADMIN_CHAT_STATS_MAX_LIMIT } from "@/features/admin/lib/adminChatStatsService";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { StatCard } from "@/shared/ui/StatCard";

/** 챗봇 답변 피드백 페이지. 많이 나온 순으로 최대 200개까지 보여준다. */
export const AdminUnresolvedQueue = () => {
  const { error, isLoading, stats } = useAdminChatStats(
    ADMIN_CHAT_STATS_MAX_LIMIT,
  );
  const statItems = getChatFeedbackStatItems(stats?.summary, isLoading);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
          답변 피드백
        </h1>
        <p className="text-text-secondary mt-2 text-sm font-medium">
          챗봇이 답하지 못했거나 사용자가 아쉬워요를 누른 답변을 많이 나온
          순으로 모았습니다. FAQ로 보완하거나 확인이 끝난 피드백은 무시하세요.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {statItems.map((stat) => (
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
            description="같은 질문은 하나로 묶어 발생 횟수가 많은 순으로 보여줍니다."
          />
          <CardContent>
            <AdminChatFeedbackContent
              error={error}
              isLoading={isLoading}
              stats={stats}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
