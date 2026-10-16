import type { Meta, StoryObj } from "@storybook/react";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { AuthProvider } from "@/features/auth/hooks/useAuthUser";
import { ThemeProvider } from "@/shared/ui/ThemeProvider";

const noop = () => {};
const tooltip = () => () => {};

const meta = {
  title: "Chat/ChatSidebar",
  component: ChatSidebar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
  args: {
    activeMode: "chat",
    isAuthenticated: false,
    isAuthExpired: true,
    isAuthLoading: false,
    isAuthReady: true,
    isOpen: true,
    onOpen: noop,
    onClose: noop,
    onOpenHome: noop,
    onNewChat: noop,
    onOpenLogin: noop,
    onOpenSearch: noop,
    onOpenProfile: noop,
    onOpenSettings: noop,
    onStartTour: noop,
    onShowRailTooltip: tooltip,
    onShowHeaderTooltip: tooltip,
    onHideTooltip: noop,
  },
} satisfies Meta<typeof ChatSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SessionExpired: Story = {};

export const Guest: Story = {
  args: { isAuthExpired: false },
};
