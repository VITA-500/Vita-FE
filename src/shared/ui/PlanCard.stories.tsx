import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlanCard, PlanCardGroup } from "@/shared/ui/PlanCard";

const meta = {
  title: "Shared/PlanCard",
  component: PlanCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof PlanCard>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <PlanCard
      planName="5G 심플"
      description="가볍게 쓰는 분에게 맞는 기본 요금제"
      price="39,000"
      features={["데이터 6GB + 무제한 400Kbps", "통화 · 문자 기본 제공"]}
      actionLabel="이 요금제 선택하기"
    />
  ),
};

export const Recommended: Story = {
  name: "Highlighted (추천)",
  render: () => (
    <PlanCard
      highlighted
      badge="추천"
      planName="5G 프리미엄"
      description="데이터를 많이 쓰는 분에게 가장 잘 맞아요"
      price="79,000"
      features={["데이터 완전 무제한", "가족 결합 시 최대 2만원 할인"]}
      actionLabel="이 요금제 선택하기"
    />
  ),
};

const comparisonPlans = [
  {
    id: "simple",
    planName: "5G 심플",
    price: "39,000",
    features: ["데이터 6GB", "통화 · 문자 기본 제공"],
    actionLabel: "선택하기",
  },
  {
    id: "premium",
    badge: "추천",
    highlighted: true,
    planName: "5G 프리미엄",
    price: "79,000",
    features: ["데이터 완전 무제한", "가족 결합 할인"],
    actionLabel: "선택하기",
  },
  {
    id: "special",
    planName: "5G 스페셜",
    price: "99,000",
    features: ["데이터 완전 무제한", "해외 로밍 무료 3GB"],
    actionLabel: "선택하기",
  },
  {
    id: "senior",
    planName: "5G 시니어",
    price: "29,000",
    features: ["데이터 4GB", "가족 안심 알림"],
    actionLabel: "선택하기",
  },
] as const;

export const InChatBubble: Story = {
  name: "채팅 답변 안에서 (3~4개 비교)",
  render: () => (
    <div className="border-border text-text-primary max-w-[620px] rounded-3xl border bg-white p-5 text-sm leading-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <p>고객님 사용 패턴을 보면 아래 요금제들이 잘 맞아요. 비교해 보세요.</p>

      <div className="mt-4">
        <PlanCardGroup plans={comparisonPlans} />
      </div>
    </div>
  ),
};

export const Comparison: Story = {
  name: "여러 요금제 비교 (일반 화면)",
  render: () => <PlanCardGroup className="flex-wrap" plans={comparisonPlans} />,
};
