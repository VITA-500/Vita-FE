import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

const meta = {
  title: "Shared/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Modal>;

export default meta;

const ModalPreview = ({ kind }: { kind: "alert" | "delete" | "create" }) => {
  const content = {
    alert: {
      title: "저장이 완료되었습니다",
      description: "변경한 내용이 정상적으로 반영되었습니다.",
      actions: <Button size="sm">확인</Button>,
    },
    delete: {
      title: "FAQ를 삭제할까요?",
      description: "삭제한 FAQ는 목록에서 제거되며 다시 되돌릴 수 없습니다.",
      actions: (
        <>
          <Button variant="ghost" size="sm">
            취소
          </Button>
          <Button variant="danger" size="sm">
            삭제
          </Button>
        </>
      ),
    },
    create: {
      title: "매장을 추가할까요?",
      description: "입력한 매장 정보가 관리자 목록과 지도 데이터에 반영됩니다.",
      actions: (
        <>
          <Button variant="secondary" size="sm">
            취소
          </Button>
          <Button size="sm">추가</Button>
        </>
      ),
    },
  }[kind];

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      title={content.title}
      description={content.description}
      actions={content.actions}
    />
  );
};

type Story = StoryObj<typeof ModalPreview>;

export const Alert: Story = {
  name: "Alert Card",
  render: () => <ModalPreview kind="alert" />,
};

export const DeleteConfirm: Story = {
  name: "Delete Confirm Card",
  render: () => <ModalPreview kind="delete" />,
};

export const CreateConfirm: Story = {
  name: "Create Confirm Card",
  render: () => <ModalPreview kind="create" />,
};
