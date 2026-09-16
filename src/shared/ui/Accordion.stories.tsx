import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion } from "@/shared/ui/Accordion";

const meta = {
  title: "Shared/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj;

export const CombinedDiscountConditions: Story = {
  name: "결합할인 상세 조건",
  render: () => (
    <div className="max-w-[420px]">
      <Accordion
        defaultOpenIndex={0}
        items={[
          {
            question: "가족관계 증빙이 필요한가요?",
            answer:
              "네, 등본이나 가족관계증명서로 확인이 필요해요. 매장 방문 시 지참해 주세요.",
          },
          {
            question: "결합 가능한 회선 수는 몇 개인가요?",
            answer: "최대 5회선까지 결합할 수 있어요.",
          },
          {
            question: "인터넷/TV와도 결합할 수 있나요?",
            answer: "네, 인터넷·TV 결합 시 추가 할인이 적용돼요.",
          },
          {
            question: "해지하면 할인은 어떻게 되나요?",
            answer:
              "결합을 해지하면 남은 약정 기간에 대해 받은 할인 금액이 반환될 수 있어요.",
          },
        ]}
      />
    </div>
  ),
};
