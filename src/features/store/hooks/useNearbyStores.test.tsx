import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNearbyStores } from "./useNearbyStores";
import { storeService } from "@/features/store/lib/storeService";
import type { StoreMapSnapshot } from "@/features/store/lib/storeMapSnapshot";
import type { StoreLocation, StoreOpenFilter } from "@/features/store/types";
import { showToast } from "@/shared/providers/ToastProvider";

vi.mock("@/features/store/lib/storeService", () => ({
  storeService: { fetchNearbyStores: vi.fn() },
}));
vi.mock("@/shared/providers/ToastProvider", () => ({ showToast: vi.fn() }));

const fetchNearbyStores = vi.mocked(storeService.fetchNearbyStores);

const store = (id: string): StoreLocation => ({
  address: "",
  id,
  lat: 37.5,
  lng: 127,
  name: `매장 ${id}`,
  phone: "",
});

/** 기본 위치(선릉역 부근)를 소수 셋째 자리로 맞춘 조회 지점 */
const DEFAULT_LOOKUP = { lat: 37.503, lng: 127.05 };
const ALL: StoreOpenFilter = { mode: "all" };

type Props = {
  openFilter: StoreOpenFilter;
  restoredSnapshot: StoreMapSnapshot | null;
  userLocation: { lat: number; lng: number } | null;
};

const setup = (initial: Partial<Props> = {}) => {
  const setters = {
    setFocusPoint: vi.fn(),
    setHasSelectedStoreInfo: vi.fn(),
    setIsMapSearchLoading: vi.fn(),
    setIsWaitingForPinSelection: vi.fn(),
    setSearchPoint: vi.fn(),
    setSelectedStoreId: vi.fn(),
    setStores: vi.fn(),
    setStoresOrigin: vi.fn(),
    setSubmittedSearchStores: vi.fn(),
  };
  const refs = {
    areaSearchRequestIdRef: { current: 0 },
    shouldFocusUserLocationRef: { current: false },
  };
  const hook = renderHook(
    (props: Props) => useNearbyStores({ ...setters, ...refs, ...props }),
    {
      initialProps: {
        openFilter: ALL,
        restoredSnapshot: null,
        userLocation: null,
        ...initial,
      },
    },
  );

  return { ...hook, refs, setters };
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useNearbyStores 들어올 때·위치 갱신", () => {
  it("위치가 없으면 기본 위치로 한 번 조회한다", async () => {
    fetchNearbyStores.mockResolvedValue([store("a")]);
    const { setters } = setup();

    await waitFor(() =>
      expect(setters.setStores).toHaveBeenCalledWith([store("a")]),
    );
    expect(fetchNearbyStores).toHaveBeenCalledTimes(1);
    expect(fetchNearbyStores).toHaveBeenCalledWith(DEFAULT_LOOKUP, undefined, {
      openFilter: ALL,
    });
    expect(setters.setStoresOrigin).toHaveBeenCalledWith(DEFAULT_LOOKUP);
  });

  it("첫 위치를 받으면 지도를 옮기고 그 지점으로 다시 조회한다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const { rerender, setters } = setup();
    const location = { lat: 37.5101, lng: 127.0201 };

    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: location,
    });

    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(2));
    expect(setters.setFocusPoint).toHaveBeenCalledWith(location);
    expect(setters.setSearchPoint).toHaveBeenCalledWith(null);
    expect(fetchNearbyStores).toHaveBeenLastCalledWith(
      { lat: 37.51, lng: 127.02 },
      undefined,
      { openFilter: ALL },
    );
  });

  it("같은 지점(소수 셋째 자리)으로 위치만 갱신되면 다시 조회하지 않는다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const { rerender } = setup({
      userLocation: { lat: 37.5101, lng: 127.0201 },
    });

    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(1));
    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.5103, lng: 127.0204 },
    });
    await act(async () => {});

    expect(fetchNearbyStores).toHaveBeenCalledTimes(1);
  });

  it("늦게 도착한 이전 지점의 응답은 무시한다", async () => {
    let resolveFirst!: (stores: StoreLocation[]) => void;
    fetchNearbyStores
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce([store("b")]);
    const { rerender, setters } = setup({
      userLocation: { lat: 37.51, lng: 127.02 },
    });

    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.52, lng: 127.03 },
    });
    await waitFor(() =>
      expect(setters.setStores).toHaveBeenCalledWith([store("b")]),
    );
    await act(async () => resolveFirst([store("a")]));

    expect(setters.setStores).toHaveBeenCalledTimes(1);
    expect(setters.setStores).not.toHaveBeenCalledWith([store("a")]);
  });

  it("되살린 화면이면 자동 조회·내 위치 이동을 건너뛰고, 영업 시간 필터를 바꾸면 보던 지역을 다시 조회한다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const restoredSnapshot = {
      storesOrigin: { lat: 37.55, lng: 126.97 },
    } as StoreMapSnapshot;
    const userLocation = { lat: 37.51, lng: 127.02 };
    const { rerender, setters } = setup({ restoredSnapshot, userLocation });
    await act(async () => {});

    expect(fetchNearbyStores).not.toHaveBeenCalled();
    expect(setters.setFocusPoint).not.toHaveBeenCalled();

    const now: StoreOpenFilter = { mode: "now" };
    rerender({ openFilter: now, restoredSnapshot, userLocation });

    // 되살린 화면은 사용자가 보던 지역이라, 내 위치가 아니라 그 지역을 새 조건으로 다시 조회한다.
    await waitFor(() =>
      expect(fetchNearbyStores).toHaveBeenCalledWith(
        { lat: 37.55, lng: 126.97 },
        undefined,
        { openFilter: now },
      ),
    );
    expect(fetchNearbyStores).toHaveBeenCalledTimes(1);
  });
});

describe("useNearbyStores 이 위치에서 검색", () => {
  it("결과가 없으면 목록은 두고 안내 후 직전 지역으로 돌아간다", async () => {
    vi.useFakeTimers();
    fetchNearbyStores.mockResolvedValueOnce([store("a")]);
    const { result, setters } = setup();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(setters.setStores).toHaveBeenCalledTimes(1);

    fetchNearbyStores.mockResolvedValueOnce([]);
    act(() => {
      result.current.updateStoresByLocation(
        { lat: 35.1, lng: 129.0 },
        { restoreOnEmpty: true, showLoadingCard: true },
      );
    });
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining("1.5km 안에는 매장 정보가 없어요"),
    );
    expect(setters.setStores).toHaveBeenCalledTimes(1);
    expect(setters.setSubmittedSearchStores).toHaveBeenCalledWith(null);
    expect(setters.setFocusPoint).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1400));
    expect(setters.setFocusPoint).toHaveBeenCalledWith(DEFAULT_LOOKUP);
    expect(setters.setIsMapSearchLoading).toHaveBeenLastCalledWith(false);
  });

  it("결과가 없어 되돌아가면 따라가기 상태도 되돌려 위치 갱신을 다시 따른다", async () => {
    fetchNearbyStores.mockResolvedValueOnce([store("a")]);
    const { rerender, result } = setup({
      userLocation: { lat: 37.51, lng: 127.02 },
    });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(1));

    fetchNearbyStores.mockResolvedValueOnce([]);
    act(() => {
      result.current.updateStoresByLocation(
        { lat: 35.1, lng: 129.0 },
        { restoreOnEmpty: true },
      );
    });
    await waitFor(() => expect(showToast).toHaveBeenCalled());

    fetchNearbyStores.mockResolvedValueOnce([]);
    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.52, lng: 127.03 },
    });

    await waitFor(() =>
      expect(fetchNearbyStores).toHaveBeenLastCalledWith(
        { lat: 37.52, lng: 127.03 },
        undefined,
        { openFilter: ALL },
      ),
    );
  });

  it("새 지역을 조회하면 진행 중인 영역 검색 응답을 무효화한다", async () => {
    fetchNearbyStores.mockResolvedValue([store("area")]);
    const { refs, result, setters } = setup();
    await waitFor(() => expect(setters.setStores).toHaveBeenCalled());
    const requestId = refs.areaSearchRequestIdRef.current;

    act(() => {
      result.current.updateStoresByLocation({ lat: 37.6, lng: 127.1 });
    });

    expect(refs.areaSearchRequestIdRef.current).toBe(requestId + 1);
    await waitFor(() =>
      expect(setters.setStoresOrigin).toHaveBeenLastCalledWith({
        lat: 37.6,
        lng: 127.1,
      }),
    );
  });

  it("직접 고른 지역 결과는 내 위치가 갱신돼도 유지한다", async () => {
    // 길찾기 중 위치 추적(watchLocation)처럼 위치가 계속 갱신되는 경우
    fetchNearbyStores.mockResolvedValueOnce([store("first")]);
    const { rerender, result, setters } = setup({
      userLocation: { lat: 37.51, lng: 127.02 },
    });
    await waitFor(() =>
      expect(setters.setStores).toHaveBeenCalledWith([store("first")]),
    );

    fetchNearbyStores.mockResolvedValueOnce([store("area")]);
    act(() => {
      result.current.updateStoresByLocation({ lat: 37.6, lng: 127.1 });
    });
    await waitFor(() =>
      expect(setters.setStores).toHaveBeenLastCalledWith([store("area")]),
    );

    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.512, lng: 127.02 },
    });
    await act(async () => {});

    expect(fetchNearbyStores).toHaveBeenCalledTimes(2);
    expect(setters.setStores).toHaveBeenLastCalledWith([store("area")]);
  });

  it("고른 지역을 보는 중 영업 시간 필터를 바꾸면 그 지역을 다시 조회한다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const userLocation = { lat: 37.51, lng: 127.02 };
    const { rerender, result } = setup({ userLocation });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.updateStoresByLocation({ lat: 37.6, lng: 127.1 });
    });

    const now: StoreOpenFilter = { mode: "now" };
    rerender({ openFilter: now, restoredSnapshot: null, userLocation });

    await waitFor(() =>
      expect(fetchNearbyStores).toHaveBeenLastCalledWith(
        { lat: 37.6, lng: 127.1 },
        undefined,
        { openFilter: now },
      ),
    );
  });

  it("내 위치 버튼으로 다시 따라가면 이후 위치 갱신에 맞춰 조회한다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const { rerender, result } = setup({
      userLocation: { lat: 37.51, lng: 127.02 },
    });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.updateStoresByLocation({ lat: 37.6, lng: 127.1 });
    });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(2));

    act(() => result.current.resumeFollowingUserLocation());
    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.52, lng: 127.03 },
    });

    await waitFor(() =>
      expect(fetchNearbyStores).toHaveBeenLastCalledWith(
        { lat: 37.52, lng: 127.03 },
        undefined,
        { openFilter: ALL },
      ),
    );
  });

  it("기본 검색으로 돌아가는 조회(followUserLocation)는 따라가기를 다시 켠다", async () => {
    fetchNearbyStores.mockResolvedValue([]);
    const { rerender, result } = setup({
      userLocation: { lat: 37.51, lng: 127.02 },
    });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(1));
    act(() => {
      result.current.updateStoresByLocation({ lat: 37.6, lng: 127.1 });
    });
    act(() => {
      result.current.updateStoresByLocation(
        { lat: 37.51, lng: 127.02 },
        { followUserLocation: true },
      );
    });
    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(3));

    rerender({
      openFilter: ALL,
      restoredSnapshot: null,
      userLocation: { lat: 37.52, lng: 127.03 },
    });

    await waitFor(() => expect(fetchNearbyStores).toHaveBeenCalledTimes(4));
  });
});
