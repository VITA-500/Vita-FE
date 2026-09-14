import type { StoreLocation } from "@/features/store/types";

export const mockStores: StoreLocation[] = [
  {
    id: "gangnam-001",
    name: "VITA 강남역점",
    address: "서울 강남구 강남대로 396",
    phone: "02-0000-0001",
    lat: 37.498095,
    lng: 127.02761,
    distanceText: "약 320m",
  },
  {
    id: "seocho-001",
    name: "VITA 서초점",
    address: "서울 서초구 서초대로 74길 45",
    phone: "02-0000-0002",
    lat: 37.494667,
    lng: 127.028002,
    distanceText: "약 640m",
  },
  {
    id: "yeoksam-001",
    name: "VITA 역삼점",
    address: "서울 강남구 테헤란로 152",
    phone: "02-0000-0003",
    lat: 37.500685,
    lng: 127.036541,
    distanceText: "약 1.1km",
  },
];
