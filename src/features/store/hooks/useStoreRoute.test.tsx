import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  renderHook as renderHookBase,
  waitFor,
  type RenderHookOptions,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStoreRoute } from "./useStoreRoute";
import { routeApi } from "@/entities/route";
import type { StoreLocation } from "@/entities/store";
import type { StoreRoute } from "@/entities/route";

// 공개 API(@/entities/route)가 다시 내보내는 routeApi가 이 모킹 값이 된다.
vi.mock("@/entities/route/api/routeApi", () => ({
  routeApi: { fetchRoute: vi.fn() },
}));

const fetchRoute = vi.mocked(routeApi.fetchRoute);

/** 테스트마다 새 QueryClient로 감싸 캐시가 테스트끼리 섞이지 않게 한다. */
const renderHook = <Result, Props>(
  callback: (props: Props) => Result,
  options?: RenderHookOptions<Props>,
) => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return renderHookBase(callback, { ...options, wrapper });
};

const destination: StoreLocation = {
  address: "서울 강남구",
  id: "10",
  lat: 37.51,
  lng: 127.02,
  name: "VITA 강남점",
  phone: "",
};
const route = (mode: StoreRoute["mode"]): StoreRoute => ({
  distanceMeters: 800,
  durationSeconds: 600,
  mode,
  path: [],
});
const here = { lat: 37.5, lng: 127.0 };

afterEach(() => vi.clearAllMocks());

describe("useStoreRoute", () => {
  it("위치가 없으면 조회하지 않고 탐색 중 상태로 기다린다", async () => {
    const { result } = renderHook(() => useStoreRoute(null));

    act(() => result.current.startRoute(destination));
    await act(async () => {});

    expect(fetchRoute).not.toHaveBeenCalled();
    expect(result.current.isRouteLoading).toBe(true);
    expect(result.current.routeDestinationSnapshot).toBe(destination);
  });

  it("도착 매장·위치가 있으면 도보 경로를 조회한다", async () => {
    fetchRoute.mockResolvedValue(route("walk"));
    const { result } = renderHook(() => useStoreRoute(here));

    act(() => result.current.startRoute(destination));

    await waitFor(() => expect(result.current.isRouteLoading).toBe(false));
    expect(fetchRoute).toHaveBeenCalledWith("10", here, "walk");
    expect(result.current.walkingRoute).toEqual(route("walk"));
  });

  it("이동수단을 바꾸면 이전 경로를 비우고 새 이동수단으로 다시 조회한다", async () => {
    fetchRoute.mockImplementation(async (_, __, mode) => route(mode));
    const { result } = renderHook(() => useStoreRoute(here));
    act(() => result.current.startRoute(destination));
    await waitFor(() => expect(result.current.walkingRoute).not.toBeNull());

    act(() => result.current.changeRouteMode("transit"));
    expect(result.current.walkingRoute).toBeNull();
    expect(result.current.isRouteLoading).toBe(true);

    await waitFor(() =>
      expect(result.current.walkingRoute).toEqual(route("transit")),
    );
    expect(fetchRoute).toHaveBeenLastCalledWith("10", here, "transit");
  });

  it("경로가 없으면 다른 이동수단 안내를 띄운다", async () => {
    fetchRoute.mockRejectedValue(new Error("NO_ROUTE"));
    const { result } = renderHook(() => useStoreRoute(here));

    act(() => result.current.startRoute(destination));

    await waitFor(() =>
      expect(result.current.routeResultMessage).toContain(
        "해당 교통 수단의 길찾기 결과가 없습니다",
      ),
    );
    expect(result.current.walkingRoute).toBeNull();
    expect(result.current.isRouteLoading).toBe(false);
  });

  it("이전 이동수단의 늦은 응답은 무시한다", async () => {
    let resolveWalk!: (value: StoreRoute) => void;
    fetchRoute
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveWalk = resolve)),
      )
      .mockResolvedValueOnce(route("car"));
    const { result } = renderHook(() => useStoreRoute(here));

    act(() => result.current.startRoute(destination));
    act(() => result.current.changeRouteMode("car"));
    await waitFor(() =>
      expect(result.current.walkingRoute).toEqual(route("car")),
    );
    await act(async () => resolveWalk(route("walk")));

    expect(result.current.walkingRoute).toEqual(route("car"));
  });

  it("도보는 30m 이상 움직였을 때만 경로를 다시 조회한다 (GPS 흔들림 무시)", async () => {
    fetchRoute.mockResolvedValue(route("walk"));
    const { rerender, result } = renderHook(
      ({ location }) => useStoreRoute(location),
      { initialProps: { location: here } },
    );
    act(() => result.current.startRoute(destination));
    await waitFor(() => expect(fetchRoute).toHaveBeenCalledTimes(1));

    // 위도 0.0001도 ≈ 11m: 제자리 GPS 흔들림
    rerender({ location: { lat: 37.5001, lng: 127.0 } });
    rerender({ location: { lat: 37.5002, lng: 127.0 } });
    await act(async () => {});
    expect(fetchRoute).toHaveBeenCalledTimes(1);

    // 처음 조회한 위치에서 약 44m
    const moved = { lat: 37.5004, lng: 127.0 };
    rerender({ location: moved });
    await waitFor(() => expect(fetchRoute).toHaveBeenCalledTimes(2));
    expect(fetchRoute).toHaveBeenLastCalledWith("10", moved, "walk");
  });

  it("대중교통·차량은 100m 이상 움직였을 때만 다시 조회한다", async () => {
    fetchRoute.mockImplementation(async (_, __, mode) => route(mode));
    const { rerender, result } = renderHook(
      ({ location }) => useStoreRoute(location),
      { initialProps: { location: here } },
    );
    act(() => result.current.startRoute(destination));
    act(() => result.current.changeRouteMode("transit"));
    await waitFor(() =>
      expect(fetchRoute).toHaveBeenLastCalledWith("10", here, "transit"),
    );
    const callsAfterModeChange = fetchRoute.mock.calls.length;

    // 약 55m: 도보 기준은 넘지만 대중교통 기준(100m)은 안 넘는다
    rerender({ location: { lat: 37.5005, lng: 127.0 } });
    await act(async () => {});
    expect(fetchRoute).toHaveBeenCalledTimes(callsAfterModeChange);

    // 약 133m
    rerender({ location: { lat: 37.5012, lng: 127.0 } });
    await waitFor(() =>
      expect(fetchRoute).toHaveBeenCalledTimes(callsAfterModeChange + 1),
    );
  });

  it("길찾기를 끝내면 도착 매장 기록까지 비운다", async () => {
    fetchRoute.mockResolvedValue(route("walk"));
    const { result } = renderHook(() => useStoreRoute(here));
    act(() => result.current.startRoute(destination));
    await waitFor(() => expect(result.current.walkingRoute).not.toBeNull());

    act(() => result.current.resetRouteState());

    expect(result.current.routeDestinationStoreId).toBe("");
    expect(result.current.routeDestinationSnapshot).toBeNull();
    expect(result.current.walkingRoute).toBeNull();
  });
});
