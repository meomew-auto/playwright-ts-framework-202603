import { APIRequestContext, APIResponse } from "@playwright/test";
import { BaseApiClient } from "./BaseApiClient";
import {
  RegisterRequest,
  LoginRequest,
  userProfileSchema,
  UserProfile,
  authTokenResponseSchema,
  AuthTokenResponse,
} from "../schemas/neko";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🔐 AUTH API CLIENT (AOM - API OBJECT MODEL)
 * ════════════════════════════════════════════════════════════════════════════
 * Quản lý toàn diện các API liên quan đến Xác thực & Phân quyền Neko Coffee:
 * - Đăng ký tài khoản (POST /auth/register)
 * - Đăng nhập nhận JWT Token (POST /auth/login)
 * - Lấy thông tin tài khoản hiện tại (GET /auth/me)
 * - Làm mới Token (POST /auth/refresh)
 */
export class AuthApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ── 1. HTTP RAW METHODS (Kiểm tra Status Code, Header, Test lỗi 401/403) ──

  public async register(payload: RegisterRequest): Promise<APIResponse> {
    return this.post("/auth/register", { data: payload });
  }

  public async login(payload: LoginRequest): Promise<APIResponse> {
    return this.post("/auth/login", { data: payload });
  }

  public async getMe(tokenOverride?: string): Promise<APIResponse> {
    const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : undefined;
    return this.get("/auth/me", { headers });
  }

  public async refreshToken(refreshToken: string): Promise<APIResponse> {
    return this.post("/auth/refresh", { data: { refresh_token: refreshToken } });
  }

  // ── 2. SMART DATA METHODS (Tự động thẩm định Zod Contract & trả về typed data) ──

  /**
   * ⚡ Smart Data Method: Đăng nhập và tự động thẩm định Auth Token qua Zod Schema.
   */
  public async loginData(payload: LoginRequest): Promise<AuthTokenResponse> {
    const response = await this.login(payload);
    return this.parseResponse(response, authTokenResponseSchema);
  }

  /**
   * ⚡ Smart Data Method: Lấy User Profile và tự động validate qua userProfileSchema.
   */
  public async getMeData(tokenOverride?: string): Promise<UserProfile> {
    const response = await this.getMe(tokenOverride);
    return this.parseResponse(response, userProfileSchema);
  }
}
