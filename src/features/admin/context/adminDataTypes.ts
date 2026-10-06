import type {
  AdminFaq,
  AdminFaqCategory,
  AdminFaqStatus,
  AdminStore,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";

export type FaqSaveInput = Pick<AdminFaq, "category" | "question"> & {
  answer: string;
  subcategory?: string;
};

export type StoreSaveInput = Omit<
  AdminStoreDetail,
  | "brand"
  | "category"
  | "benefitName"
  | "createdAt"
  | "storeId"
  | "storeType"
  | "updatedAt"
>;

export type StoreSortField = "createdAt" | "name" | "updatedAt";
export type StoreSortDirection = "asc" | "desc";
export type FaqSortField = "createdAt" | "updatedAt";
export type FaqSortDirection = "asc" | "desc";
export type FaqCategoryFilter = "ALL" | AdminFaqCategory;
export type FaqStatusFilter = "ALL" | AdminFaqStatus;

export type AdminFaqData = {
  faqs: AdminFaq[];
  addFaq: (input: FaqSaveInput) => Promise<void>;
  deleteFaq: (faqId: number) => Promise<void>;
  faqCategoryFilter: FaqCategoryFilter;
  faqError: string | null;
  faqKeyword: string;
  faqPage: number;
  faqPageSize: number;
  faqSortDirection: FaqSortDirection;
  faqSortField: FaqSortField;
  faqStatusFilter: FaqStatusFilter;
  faqTotalCount: number;
  faqTotalPages: number;
  isFaqLoading: boolean;
  refreshFaqs: () => Promise<void>;
  saveFaq: (faqId: number, input: FaqSaveInput) => Promise<void>;
  setFaqCategoryFilter: (category: FaqCategoryFilter) => void;
  setFaqKeyword: (keyword: string) => void;
  setFaqPage: (page: number) => void;
  setFaqPageSize: (pageSize: number) => void;
  setFaqSort: (field: FaqSortField, direction: FaqSortDirection) => void;
  setFaqStatus: (faqId: number, status: AdminFaq["status"]) => Promise<void>;
  setFaqStatusFilter: (status: FaqStatusFilter) => void;
};

export type AdminStoreData = {
  addStore: (input: StoreSaveInput) => Promise<void>;
  stores: AdminStore[];
  storeDetails: AdminStoreDetail[];
  storeError: string | null;
  storeKeyword: string;
  storePage: number;
  storePageSize: number;
  storeSortDirection: StoreSortDirection;
  storeSortField: StoreSortField;
  storeTypeFilter: AdminStoreType;
  storeTotalCount: number;
  storeTotalPages: number;
  isStoreLoading: boolean;
  getStoreDetail: (storeId: number) => AdminStoreDetail | undefined;
  refreshStores: () => Promise<void>;
  saveStore: (storeId: number, input: StoreSaveInput) => Promise<void>;
  saveStores: (inputs: Record<number, StoreSaveInput>) => Promise<void>;
  setStoreKeyword: (keyword: string) => void;
  setStorePage: (page: number) => void;
  setStorePageSize: (pageSize: number) => void;
  setStoreSort: (field: StoreSortField, direction: StoreSortDirection) => void;
  setStoreTypeFilter: (storeType: AdminStoreType) => void;
  deleteStore: (storeId: number) => Promise<void>;
};

export type AdminDataContextValue = AdminFaqData & AdminStoreData;
