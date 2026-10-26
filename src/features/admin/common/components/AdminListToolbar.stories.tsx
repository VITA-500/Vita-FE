import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminListToolbar } from "@/features/admin/common/components/AdminListToolbar";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { Button } from "@/shared/ui/atoms/Button";

const meta = {
  title: "Admin/Common/AdminListToolbar",
  component: AdminListToolbar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdminListToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => (
    <AdminListToolbar>
      <div className="flex max-w-[520px] gap-2">
        <SearchInput placeholder="검색어를 입력하세요" />
        <Button variant="secondary" size="sm" className="shrink-0">
          초기화
        </Button>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10">
          <button className="border-brand text-brand border-b-2 px-4 py-2.5 text-sm font-semibold">
            전체
          </button>
          <button className="px-4 py-2.5 text-sm font-semibold text-gray-500">
            활성
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <FilterDropdown
            aria-label="정렬"
            value="recent"
            options={[{ label: "최신순", value: "recent" }]}
            onChange={() => undefined}
          />
          <FilterDropdown
            aria-label="페이지당 개수"
            value="20"
            options={[{ label: "20개씩", value: "20" }]}
            onChange={() => undefined}
          />
        </div>
      </div>
    </AdminListToolbar>
  ),
};
