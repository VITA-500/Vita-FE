import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChecklistCard } from "@/shared/ui/ChecklistCard";

const meta = {
  title: "Shared/ChecklistCard",
  component: ChecklistCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ChecklistCard>;

export default meta;

type Story = StoryObj;

export const Preparation: Story = {
  name: "준비물 (유심 재발급)",
  render: () => (
    <div className="max-w-[320px]">
      <ChecklistCard
        title="방문 전 준비물"
        items={[{ label: "신분증" }, { label: "기존 회선 정보" }]}
      />
    </div>
  ),
};

export const Eligibility: Story = {
  name: "자격 조건 확인 (가족 결합)",
  render: () => (
    <div className="max-w-[320px]">
      <ChecklistCard
        title="가족 결합 할인 조건"
        items={[
          { label: "가족 2인 이상", met: true },
          { label: "동일 명의 회선", met: true },
          { label: "인터넷 결합", met: false },
        ]}
      />
    </div>
  ),
};
