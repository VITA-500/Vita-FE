// 사용자 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
// 로그인 상태(AuthProvider·useAuthUser)와 로그인·회원가입 흐름은 아직 features/auth에 있다.
export { userApi } from "@/entities/user/api/userApi";
export { adminUserApi } from "@/entities/user/api/admin";
export type {
  AuthUser,
  MyPageResponse,
  MyPageUpdateRequest,
  MyPageUpdateResponse,
} from "@/entities/user/model/types";
export type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserListResponse,
  AdminUserRole,
  AdminUserStatus,
} from "@/entities/user/model/adminUsers";
