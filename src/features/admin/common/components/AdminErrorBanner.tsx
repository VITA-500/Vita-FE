type AdminErrorBannerProps = {
  message: string;
};

export const AdminErrorBanner = ({ message }: AdminErrorBannerProps) => (
  <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
    {message}
  </div>
);
