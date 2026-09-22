"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { SortDropdown } from "@/features/admin/components/SortDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import type { AdminStoreDetail } from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { AnimatedLockIcon } from "@/shared/ui/AnimatedLockIcon";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent, CardHeader } from "@/shared/ui/Card";
import { ConfirmCheckbox } from "@/shared/ui/ConfirmCheckbox";
import { Modal } from "@/shared/ui/Modal";
import { SearchInput } from "@/shared/ui/SearchInput";

type StoreDraft = {
  name: string;
  address: string;
  lat: string;
  lng: string;
  businessHours: string;
  phone: string;
  consultServices: string;
  providedServices: string;
};

const toDraft = (store: AdminStoreDetail): StoreDraft => ({
  name: store.name,
  address: store.address,
  lat: String(store.lat),
  lng: String(store.lng),
  businessHours: store.businessHours ?? "",
  phone: store.phone ?? "",
  consultServices: store.consultServices.join(", "),
  providedServices: store.providedServices.join(", "),
});

export const StoreManagement = () => {
  const {
    addStore,
    deleteStore,
    getStoreDetail,
    saveStore,
    saveStores,
    stores,
  } = useAdminData();
  const { runWithStatus } = useActionStatus();
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sortLabel, setSortLabel] = useState("이름순");

  // 매장정보 수정 카드: 여러 매장을 선택하면 이 인덱스로 하나씩 넘겨보며 수정해요.
  const [activeSelectionIndex, setActiveSelectionIndex] = useState(0);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, StoreDraft>>({});
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  // 매장별로 따로 기억해요. 이렇게 안 하면 여러 매장을 삭제하려고 화살표로
  // 넘나들 때마다 이미 체크했던 매장의 체크가 풀려 보여서, 매번 다시
  // 체크해야 했어요.
  const [deleteAcknowledgedIds, setDeleteAcknowledgedIds] = useState<
    Set<number>
  >(new Set());

  const visibleStores = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return stores
      .filter((store) => {
        if (!normalizedKeyword) return true;
        return [store.name, store.address]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);
      })
      .toSorted((a, b) =>
        sortLabel === "주소순"
          ? a.address.localeCompare(b.address, "ko")
          : a.name.localeCompare(b.name, "ko"),
      );
  }, [keyword, sortLabel, stores]);

  const isAllSelected =
    visibleStores.length > 0 &&
    visibleStores.every((store) => selectedStoreIds.includes(store.storeId));

  const editingStore = stores.find((store) => store.storeId === editingStoreId);
  const editingStoreDetail = editingStore
    ? getStoreDetail(editingStore.storeId)
    : undefined;

  const selectedStores = selectedStoreIds
    .map((storeId) => getStoreDetail(storeId))
    .filter((store): store is AdminStoreDetail => Boolean(store));

  const resetSelectionReview = (nextSelectedIds: number[]) => {
    setActiveSelectionIndex(0);
    setVisitedIndices(nextSelectedIds.length > 0 ? new Set([0]) : new Set());
    // 선택에서 빠진 매장의 체크만 지워서, 계속 선택돼 있는 매장의 체크는
    // 유지합니다.
    setDeleteAcknowledgedIds((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (!nextSelectedIds.includes(id)) next.delete(id);
      }
      return next;
    });
  };

  const activeStore = selectedStores[activeSelectionIndex];
  const isDeleteAcknowledged = activeStore
    ? deleteAcknowledgedIds.has(activeStore.storeId)
    : false;
  const activeDraft = activeStore
    ? (drafts[activeStore.storeId] ?? toDraft(activeStore))
    : null;

  // 두 draft가 필드 값까지 완전히 같은지 봐요. 수정했다가 원래 값으로 다시
  // 되돌린 경우를 잡아내기 위한 용도예요.
  const isDraftUnchanged = (original: StoreDraft, draft: StoreDraft) =>
    (Object.keys(original) as (keyof StoreDraft)[]).every(
      (key) => original[key] === draft[key],
    );

  const updateActiveDraft = (field: keyof StoreDraft, value: string) => {
    if (!activeStore || !activeDraft) return;
    const nextDraft = { ...activeDraft, [field]: value };

    setDrafts((prev) => {
      const next = { ...prev };
      // 원래 값으로 다시 돌아왔으면 "수정한 내용"에서 아예 빼요. 그래야
      // 진짜로 고친 게 하나도 없을 때는 저장 버튼이 계속 잠겨 있어요.
      if (isDraftUnchanged(toDraft(activeStore), nextDraft)) {
        delete next[activeStore.storeId];
      } else {
        next[activeStore.storeId] = nextDraft;
      }
      return next;
    });
  };

  const resetActiveDraft = () => {
    if (!activeStore) return;
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[activeStore.storeId];
      return next;
    });
  };

  const goToIndex = (index: number) => {
    setActiveSelectionIndex(index);
    setVisitedIndices((prev) => new Set(prev).add(index));
  };

  // 화살표는 한 칸씩만 이동하므로, 마지막 매장까지 도달했다는 건 처음부터
  // 순서대로 다 확인했다는 뜻이에요. 다만 "다 확인함"만으로는 저장을 풀어주면
  // 안 돼요 - 실제로 값을 하나도 안 고쳤는데도 화살표만 넘기면 저장 버튼이
  // 풀리던 문제가 있었어서, drafts에 실제 수정 내역이 있는지도 함께 봅니다.
  const hasEdits = Object.keys(drafts).length > 0;
  const isAllReviewed =
    selectedStores.length > 0 && visitedIndices.size >= selectedStores.length;
  const isSaveEnabled = isAllReviewed && hasEdits;

  const toggleAllStores = () => {
    setSelectedStoreIds((currentIds) => {
      const nextSelectedIds = isAllSelected
        ? currentIds.filter(
            (id) => !visibleStores.some((store) => store.storeId === id),
          )
        : Array.from(
            new Set([
              ...currentIds,
              ...visibleStores.map((store) => store.storeId),
            ]),
          );

      resetSelectionReview(nextSelectedIds);
      return nextSelectedIds;
    });
  };

  const toggleStore = (storeId: number) => {
    setSelectedStoreIds((currentIds) => {
      const nextSelectedIds = currentIds.includes(storeId)
        ? currentIds.filter((currentId) => currentId !== storeId)
        : [...currentIds, storeId];

      resetSelectionReview(nextSelectedIds);
      return nextSelectedIds;
    });
  };

  // 삭제 후에는 선택 목록/임시 수정본에서도 함께 빼고, 리뷰 순서를 처음부터
  // 다시 세요.
  const removeStoreFromSelection = (storeId: number) => {
    setSelectedStoreIds((currentIds) => {
      const nextSelectedIds = currentIds.filter((id) => id !== storeId);
      setDrafts((prevDrafts) => {
        const nextDrafts = { ...prevDrafts };
        delete nextDrafts[storeId];
        return nextDrafts;
      });
      resetSelectionReview(nextSelectedIds);
      return nextSelectedIds;
    });
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
            매장 관리
          </h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            매장 데이터를 수정, 삭제, 추가할 수 있습니다.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsAddModalOpen(true)}
        >
          매장 추가
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              className="max-w-[380px]"
              placeholder="매장명이나 주소를 검색하세요"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <SortDropdown
                options={["이름순", "주소순"]}
                value={sortLabel}
                onChange={setSortLabel}
              />
            </div>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
                <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
                  <tr>
                    <th className="w-12 px-5 py-4 text-left">
                      <div className="pl-3">
                        <input
                          type="checkbox"
                          aria-label="전체 매장 선택"
                          checked={isAllSelected}
                          onChange={toggleAllStores}
                        />
                      </div>
                    </th>
                    <th className="w-[28%] px-4 py-4 text-left">매장명</th>
                    <th className="w-[44%] px-4 py-4 text-left">주소</th>
                    <th className="w-[20%] px-5 py-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-border-soft divide-y dark:divide-white/10">
                  {visibleStores.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-text-secondary px-5 py-10 text-center text-sm font-semibold"
                      >
                        조건에 맞는 매장이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    visibleStores.map((store) => {
                      return (
                        <tr
                          key={store.storeId}
                          className="hover:bg-surface-muted/70 transition dark:hover:bg-white/5"
                        >
                          <td className="px-5 py-4">
                            <div className="pl-3">
                              <input
                                type="checkbox"
                                aria-label={`${store.storeId}번 매장 선택`}
                                checked={selectedStoreIds.includes(
                                  store.storeId,
                                )}
                                onChange={() => toggleStore(store.storeId)}
                              />
                            </div>
                          </td>
                          <td className="truncate px-4 py-4 font-extrabold text-gray-800 dark:text-gray-100">
                            {store.name}
                          </td>
                          <td className="truncate px-4 py-4 font-semibold text-gray-500">
                            {store.address}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex items-center gap-2 pr-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-12 w-12 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                aria-label="매장 수정"
                                onClick={() => setEditingStoreId(store.storeId)}
                              >
                                <Edit2 size={30} />
                              </Button>
                              <Button
                                variant="dangerGhost"
                                size="sm"
                                className="h-12 w-12 rounded-lg p-0"
                                aria-label="매장 삭제"
                                onClick={() => {
                                  void runWithStatus("매장 삭제", () =>
                                    deleteStore(store.storeId),
                                  );
                                  removeStoreFromSelection(store.storeId);
                                }}
                              >
                                <Trash2 size={30} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="self-start">
          {/* 몇 곳을 선택했는지는 카운터/화살표로 이미 보이고, 아무것도
              선택 안 했을 때는 아래 CardContent에 안내 문구가 따로 있어서
              이 자리에 별도 설명 문구는 넣지 않기로 했어요. */}
          <CardHeader
            title="매장정보 수정"
            action={
              // 매장을 1곳(또는 0곳) 선택했을 때는 카운터/화살표를 안
              // 보여주는 게 맞지만, 아예 안 그리면 헤더 높이가 줄면서
              // 그 아래 border-b(외곽선) 위치가 위아래로 움직여 보였어요.
              // 그래서 항상 같은 자리를 차지하게 두고, 1곳 이하일 때는
              // invisible로 안 보이기만 하도록 했습니다.
              <div
                className={cn(
                  "flex items-center gap-1",
                  selectedStores.length <= 1 && "invisible",
                )}
                aria-hidden={selectedStores.length <= 1}
              >
                <span className="text-text-secondary mr-1 text-xs font-bold whitespace-nowrap">
                  {activeSelectionIndex + 1} / {selectedStores.length}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label="이전 매장"
                  disabled={activeSelectionIndex === 0}
                  onClick={() => goToIndex(activeSelectionIndex - 1)}
                  className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label="다음 매장"
                  disabled={activeSelectionIndex === selectedStores.length - 1}
                  onClick={() => goToIndex(activeSelectionIndex + 1)}
                  className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            }
          />

          <CardContent className="space-y-5">
            {!activeStore || !activeDraft ? (
              <p className="text-text-secondary py-6 text-center text-sm leading-6 font-medium">
                목록에서 매장을 선택하면
                <br />
                정보를 수정할 수 있어요.
              </p>
            ) : (
              <>
                <StoreField
                  label="매장명"
                  value={activeDraft.name}
                  onChange={(value) => updateActiveDraft("name", value)}
                />
                <StoreField
                  label="주소"
                  value={activeDraft.address}
                  onChange={(value) => updateActiveDraft("address", value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <StoreField
                    label="위도"
                    value={activeDraft.lat}
                    onChange={(value) => updateActiveDraft("lat", value)}
                  />
                  <StoreField
                    label="경도"
                    value={activeDraft.lng}
                    onChange={(value) => updateActiveDraft("lng", value)}
                  />
                </div>

                <StoreField
                  label="운영시간"
                  value={activeDraft.businessHours}
                  onChange={(value) =>
                    updateActiveDraft("businessHours", value)
                  }
                />
                <StoreField
                  label="전화번호"
                  value={activeDraft.phone}
                  onChange={(value) => updateActiveDraft("phone", value)}
                />
                <StoreField
                  label="상담 가능 업무"
                  value={activeDraft.consultServices}
                  onChange={(value) =>
                    updateActiveDraft("consultServices", value)
                  }
                />
                <StoreField
                  label="제공 가능 서비스"
                  value={activeDraft.providedServices}
                  onChange={(value) =>
                    updateActiveDraft("providedServices", value)
                  }
                />

                <p className="text-xs leading-5 font-semibold text-gray-400">
                  주소와 좌표는 테스트용 가상 데이터입니다.
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={resetActiveDraft}
                  >
                    취소
                  </Button>
                  <Button
                    variant={isSaveEnabled ? "primary" : "secondary"}
                    size="sm"
                    fullWidth
                    disabled={!isSaveEnabled}
                    leftIcon={
                      <AnimatedLockIcon show={!isSaveEnabled} size={16} />
                    }
                    onClick={() => setIsSaveConfirmOpen(true)}
                  >
                    변경사항 저장
                  </Button>
                </div>

                {selectedStores.length > 0 && !isSaveEnabled && (
                  <p className="text-text-secondary text-xs leading-5 font-semibold">
                    {!isAllReviewed
                      ? "화살표로 남은 매장을 모두 확인하면 저장할 수 있어요."
                      : "수정한 내용이 있어야 저장할 수 있어요."}
                  </p>
                )}

                <ConfirmCheckbox
                  checked={isDeleteAcknowledged}
                  onChange={(event) => {
                    if (!activeStore) return;
                    const storeId = activeStore.storeId;
                    setDeleteAcknowledgedIds((prev) => {
                      const next = new Set(prev);
                      if (event.target.checked) {
                        next.add(storeId);
                      } else {
                        next.delete(storeId);
                      }
                      return next;
                    });
                  }}
                >
                  매장을 삭제할 시 취소할 수 없습니다. 위 사항을 확인하였습니다.
                </ConfirmCheckbox>

                <div className="text-right">
                  <Button
                    variant="danger"
                    size="xs"
                    disabled={!isDeleteAcknowledged}
                    // 체크 전에는 눌러도 막혀 있다는 게 바로 보이도록 자물쇠
                    // 아이콘을 같이 보여줍니다 ("변경사항 저장" 버튼과 동일한
                    // 패턴). 체크 여부가 바뀔 때 아이콘이 부드럽게 사라지고
                    // 나타나도록 애니메이션을 줘요.
                    leftIcon={
                      <AnimatedLockIcon
                        show={!isDeleteAcknowledged}
                        size={14}
                      />
                    }
                    onClick={() => {
                      if (!activeStore || !isDeleteAcknowledged) return;
                      const storeId = activeStore.storeId;
                      void runWithStatus("매장 삭제", () =>
                        deleteStore(storeId),
                      );
                      removeStoreFromSelection(storeId);
                    }}
                  >
                    매장 삭제
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="매장 추가"
        description="새로 오픈한 매장의 지도 노출 정보를 입력해 주세요."
      >
        <StoreForm
          formId="store-create-form"
          submitLabel="추가"
          onCancel={() => setIsAddModalOpen(false)}
          onSave={(input) => {
            void runWithStatus("매장 추가", () => addStore(input));
            setIsAddModalOpen(false);
            setSortLabel("이름순");
          }}
        />
      </Modal>

      <StoreFormModal
        isOpen={editingStoreDetail !== undefined}
        store={editingStoreDetail}
        onClose={() => setEditingStoreId(null)}
        onSave={(input) => {
          if (!editingStoreDetail) return;
          const storeId = editingStoreDetail.storeId;
          void runWithStatus("매장 수정", () => saveStore(storeId, input));
          setEditingStoreId(null);
        }}
      />

      <Modal
        isOpen={isSaveConfirmOpen}
        onClose={() => setIsSaveConfirmOpen(false)}
        title="변경사항을 저장할까요?"
        description="아래 내용으로 저장됩니다. 한 번 더 확인해 주세요."
        size="lg"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSaveConfirmOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const count = selectedStores.length;
                const payload = Object.fromEntries(
                  selectedStores.map((store) => {
                    const draft = drafts[store.storeId] ?? toDraft(store);
                    return [
                      store.storeId,
                      {
                        name: draft.name,
                        address: draft.address,
                        lat: Number(draft.lat),
                        lng: Number(draft.lng),
                        businessHours: draft.businessHours,
                        phone: draft.phone,
                        consultServices: toServiceArray(draft.consultServices),
                        providedServices: toServiceArray(
                          draft.providedServices,
                        ),
                      },
                    ];
                  }),
                );
                void runWithStatus(`매장 ${count}곳 저장`, () =>
                  saveStores(payload),
                );
                setIsSaveConfirmOpen(false);
                setSelectedStoreIds([]);
                setDrafts({});
              }}
            >
              확인
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-xs leading-5 font-semibold text-gray-400">
            <span
              aria-hidden="true"
              className="bg-brand inline-block h-1.5 w-1.5 shrink-0 rounded-full"
            />
            표시는 기존 값과 달라진 항목이에요.
          </p>

          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {selectedStores.map((store) => {
              const original = toDraft(store);
              const draft = drafts[store.storeId] ?? original;
              const isNameChanged = draft.name !== original.name;
              return (
                <Card key={store.storeId} variant="muted" padding="sm">
                  {isNameChanged ? (
                    <Card variant="warm" padding="sm">
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-sm font-semibold text-gray-400 line-through decoration-gray-400/70 dark:text-gray-500">
                          {original.name}
                        </span>
                        <ArrowRight
                          size={14}
                          className="text-brand shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm font-extrabold text-gray-950 dark:text-white">
                          {draft.name}
                        </span>
                      </div>
                    </Card>
                  ) : (
                    <p className="text-sm font-extrabold text-gray-950 dark:text-white">
                      {draft.name}
                    </p>
                  )}
                  <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
                    <SummaryRow
                      label="주소"
                      value={draft.address}
                      previousValue={original.address}
                      changed={draft.address !== original.address}
                      className="col-span-2"
                    />
                    <SummaryRow
                      label="위도"
                      value={draft.lat}
                      previousValue={original.lat}
                      changed={draft.lat !== original.lat}
                    />
                    <SummaryRow
                      label="경도"
                      value={draft.lng}
                      previousValue={original.lng}
                      changed={draft.lng !== original.lng}
                    />
                    <SummaryRow
                      label="운영시간"
                      value={draft.businessHours}
                      previousValue={original.businessHours}
                      changed={draft.businessHours !== original.businessHours}
                    />
                    <SummaryRow
                      label="전화번호"
                      value={draft.phone}
                      previousValue={original.phone}
                      changed={draft.phone !== original.phone}
                    />
                    <SummaryRow
                      label="상담 가능 업무"
                      value={draft.consultServices}
                      previousValue={original.consultServices}
                      changed={
                        draft.consultServices !== original.consultServices
                      }
                      className="col-span-2"
                    />
                    <SummaryRow
                      label="제공 가능 서비스"
                      value={draft.providedServices}
                      previousValue={original.providedServices}
                      changed={
                        draft.providedServices !== original.providedServices
                      }
                      className="col-span-2"
                    />
                  </dl>
                </Card>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

type StoreFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: Omit<AdminStoreDetail, "storeId">) => void;
  store?: AdminStoreDetail;
};

/**
 * 목록에서 펜 아이콘을 눌렀을 때 매장 하나만 빠르게 수정하는 모달입니다.
 * 여러 매장을 한 번에 넘겨가며 수정하려면 체크박스로 선택 후 오른쪽 카드를
 * 쓰면 되고, 이건 그와 별개인 단건 수정용 진입점이에요.
 */
const StoreFormModal = ({
  isOpen,
  onClose,
  onSave,
  store,
}: StoreFormModalProps) => {
  const formId = "store-edit-form";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    onSave({
      name: String(formData.get("name") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      lat: Number(formData.get("lat")),
      lng: Number(formData.get("lng")),
      businessHours: String(formData.get("businessHours") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      consultServices: toServiceArray(formData.get("consultServices")),
      providedServices: toServiceArray(formData.get("providedServices")),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="매장 수정"
      description="이 매장 하나만 빠르게 수정합니다. 여러 매장을 한 번에 수정하려면 왼쪽 목록에서 체크박스로 선택해 주세요."
      size="lg"
    >
      <StoreForm
        formId={formId}
        initialStore={store}
        submitLabel="저장"
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};

type StoreFormProps = {
  formId: string;
  initialStore?: AdminStoreDetail;
  onCancel: () => void;
  onSave?: (input: Omit<AdminStoreDetail, "storeId">) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
};

const readStoreForm = (form: HTMLFormElement) => {
  const formData = new FormData(form);
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    businessHours: String(formData.get("businessHours") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    consultServices: toServiceArray(formData.get("consultServices")),
    providedServices: toServiceArray(formData.get("providedServices")),
  };
};

const toServiceArray = (value: FormDataEntryValue | string | null) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const StoreForm = ({
  formId,
  initialStore,
  onCancel,
  onSave,
  onSubmit,
  submitLabel,
}: StoreFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(event);
      return;
    }

    event.preventDefault();
    onSave?.(readStoreForm(event.currentTarget));
  };

  return (
    <>
      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <StoreField
          label="매장명"
          name="name"
          defaultValue={initialStore?.name}
          placeholder="예: VITA 강남점"
          className="sm:col-span-2"
          required
        />
        <StoreField
          label="주소"
          name="address"
          defaultValue={initialStore?.address}
          placeholder="예: 서울 강남구 테헤란로 111"
          className="sm:col-span-2"
          required
        />
        <StoreField
          label="위도"
          name="lat"
          defaultValue={initialStore ? String(initialStore.lat) : undefined}
          placeholder="37.2660"
          required
        />
        <StoreField
          label="경도"
          name="lng"
          defaultValue={initialStore ? String(initialStore.lng) : undefined}
          placeholder="127.0000"
          required
        />
        <StoreField
          label="운영시간"
          name="businessHours"
          defaultValue={initialStore?.businessHours}
          placeholder="예: 10:00~20:00"
          required
        />
        <StoreField
          label="전화번호"
          name="phone"
          defaultValue={initialStore?.phone}
          placeholder="예: 02-1234-5678"
        />
        <StoreField
          label="상담 가능 업무"
          name="consultServices"
          defaultValue={initialStore?.consultServices.join(", ")}
          placeholder="휴대폰상담, 요금제변경"
          className="sm:col-span-2"
        />
        <StoreField
          label="제공 가능 서비스"
          name="providedServices"
          defaultValue={initialStore?.providedServices.join(", ")}
          placeholder="유심발급, 기기변경"
          className="sm:col-span-2"
        />
      </form>

      <p className="mt-5 text-xs leading-5 font-semibold text-gray-400">
        주소와 좌표는 테스트용 가상 데이터입니다.
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" form={formId} type="submit">
          {submitLabel}
        </Button>
      </div>
    </>
  );
};

type StoreFieldProps = {
  className?: string;
  defaultValue?: string;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
};

const StoreField = ({
  className,
  defaultValue,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}: StoreFieldProps) => (
  <label className={cn("block", className)}>
    <span className="mb-2 block text-xs font-extrabold text-gray-500">
      {label}
    </span>
    <input
      value={value}
      defaultValue={defaultValue}
      name={name}
      placeholder={placeholder}
      required={required}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      className="border-border focus:border-brand focus:ring-brand/10 h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-gray-700 transition outline-none placeholder:font-medium placeholder:text-gray-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
    />
  </label>
);

type SummaryRowProps = {
  className?: string;
  label: string;
  value: string;
  changed?: boolean;
  previousValue?: string;
};

const SummaryRow = ({
  className,
  label,
  value,
  changed,
  previousValue,
}: SummaryRowProps) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <dt className="flex items-center gap-1 font-semibold text-gray-400">
      {changed && (
        <span
          aria-hidden="true"
          className="bg-brand inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        />
      )}
      {label}
    </dt>
    <dd
      className={cn(
        "font-bold text-gray-700 dark:text-gray-200",
        changed &&
          "-mx-1.5 -my-0.5 space-y-0.5 rounded-md border border-gray-100 bg-gray-100 px-1.5 py-1 dark:bg-white/5",
      )}
    >
      {changed && previousValue && (
        <p className="truncate text-[11px] font-semibold text-gray-500 line-through decoration-gray-500/70 dark:text-gray-400 dark:decoration-gray-400/70">
          {previousValue}
        </p>
      )}
      <p className="truncate">{value}</p>
    </dd>
  </div>
);
