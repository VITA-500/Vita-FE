import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";

const meta = {
  title: "Shared/Card",
  component: Card,
  parameters: {
    layout: "padded",
  },
  args: {
    padding: "md",
    variant: "default",
  },
  argTypes: {
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["default", "muted", "warm", "accent"],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className="w-[420px] max-w-full" {...args}>
      <CardHeader
        title="FAQ 관리"
        description="관리자 화면에서 FAQ 등록, 수정, 삭제 작업을 담는 기본 카드입니다."
        action={
          <Button size="sm" leftIcon={<Plus size={16} />}>
            FAQ 등록
          </Button>
        }
      />
      <CardContent>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-text-secondary">전체</dt>
            <dd className="mt-1 text-xl font-extrabold text-gray-950 dark:text-white">
              1,248
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">수정 필요</dt>
            <dd className="mt-1 text-xl font-extrabold text-gray-950 dark:text-white">
              18
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">최근 등록</dt>
            <dd className="mt-1 text-xl font-extrabold text-gray-950 dark:text-white">
              32
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[420px] max-w-full">
      <CardHeader
        title="매장 정보 수정"
        description="변경 사항을 저장하면 지도와 매장 목록에 함께 반영됩니다."
      />
      <CardContent>
        <div className="bg-surface-muted text-text-secondary rounded-xl p-4 text-sm font-semibold dark:bg-white/5">
          서울 강남점 · 서울특별시 강남구 테헤란로 123
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          취소
        </Button>
        <Button size="sm">저장</Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm font-bold text-gray-950 dark:text-white">
          기본 카드
        </p>
        <p className="text-text-secondary mt-2 text-sm">목록과 폼 영역</p>
      </Card>
      <Card variant="muted">
        <p className="text-sm font-bold text-gray-950 dark:text-white">
          보조 카드
        </p>
        <p className="text-text-secondary mt-2 text-sm">요약 정보 영역</p>
      </Card>
      <Card variant="warm">
        <p className="text-sm font-bold text-gray-950 dark:text-white">
          강조 카드
        </p>
        <p className="text-text-secondary mt-2 text-sm">중요 안내 영역</p>
      </Card>
      <Card variant="accent">
        <p className="text-sm font-bold text-gray-950 dark:text-white">
          포인트 카드
        </p>
        <p className="text-text-secondary mt-2 text-sm">
          추천 · 선택된 항목 영역
        </p>
      </Card>
    </div>
  ),
};
