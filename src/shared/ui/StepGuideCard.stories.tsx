import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StepGuideCard } from "@/shared/ui/StepGuideCard";

const meta = {
  title: "Shared/StepGuideCard",
  component: StepGuideCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof StepGuideCard>;

export default meta;

type Story = StoryObj;

export const UsimReissue: Story = {
  name: "유심 재발급 절차",
  render: () => (
    <div className="max-w-[360px]">
      <StepGuideCard
        title="유심 재발급 절차"
        description="아래 순서대로 진행하면 돼요."
        steps={[
          { title: "본인 확인 준비", description: "신분증을 준비해 주세요." },
          { title: "가까운 매장 방문" },
          { title: "유심 재발급" },
          { title: "단말 재등록" },
        ]}
      />
    </div>
  ),
};

export const PortabilityProcess: Story = {
  name: "번호이동 절차",
  render: () => (
    <div className="max-w-[360px]">
      <StepGuideCard
        steps={[
          {
            title: "가능 시간 확인",
            description: "평일 09:00~18:00에만 처리돼요.",
          },
          {
            title: "준비 서류 확인",
            description: "신분증, 기존 통신사 정보가 필요해요.",
          },
          { title: "번호이동 인증" },
          { title: "개통 완료" },
        ]}
      />
    </div>
  ),
};
