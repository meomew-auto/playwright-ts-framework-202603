import { Page, Route } from "@playwright/test";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🌐 NETWORK INTERCEPTION HELPER (BỘ CÔNG CỤ CAN THIỆP MẠNG CHUYÊN SÂU)
 * ════════════════════════════════════════════════════════════════════════════
 * Đóng gói các kỹ thuật can thiệp mạng đỉnh cao của Bài 24 thành các hàm dùng lại:
 * 1. mockJson: Giả lập trả về dữ liệu tùy biến tức thì (< 1ms).
 * 2. mockError: Giả lập lỗi máy chủ (400, 401, 403, 404, 429, 500).
 * 3. abortTrackingAndAnalytics: Chặn Google Analytics, Sentry, Facebook Pixel.
 * 4. abortMediaAndImages: Chặn hình ảnh png, jpg, webp, svg giúp tăng tốc độ test 300%.
 * 5. injectHeader: Tiêm Custom Header hoặc Feature Flag vào request đang gửi.
 * 6. injectLatency: Giả lập độ trễ mạng (chậm 2000ms) để test loading spinner & debounce.
 * 7. modifyJsonResponse: Response Tampering (bắt gói tin thật từ server và sửa đổi payload).
 */
export class NetworkInterceptionHelper {
  private static readonly DEFAULT_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Retry-After",
    "Access-Control-Expose-Headers": "Retry-After",
  };

  /**
   * 1. Mock dữ liệu JSON trả về với HTTP status tùy chọn (mặc định 200 OK)
   */
  static async mockJson(
    page: Page,
    urlPattern: string,
    jsonData: unknown,
    status = 200,
    headers?: Record<string, string>,
  ): Promise<void> {
    await page.route(urlPattern, async (route: Route) => {
      await route.fulfill({
        status,
        headers: {
          ...this.DEFAULT_CORS_HEADERS,
          ...headers,
        },
        contentType: "application/json",
        json: jsonData,
      });
    });
  }

  /**
   * 2. Mock phản hồi lỗi với mã lỗi HTTP tùy biến (401, 403, 429, 500)
   */
  static async mockError(
    page: Page,
    urlPattern: string,
    status: number,
    errorBody?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<void> {
    const payload = errorBody || {
      error: `Mocked Error HTTP ${status}`,
      message: "Phản hồi giả lập từ Playwright Network Interceptor",
      status_code: status,
    };

    await page.route(urlPattern, async (route: Route) => {
      await route.fulfill({
        status,
        headers: {
          ...this.DEFAULT_CORS_HEADERS,
          ...extraHeaders,
        },
        contentType: "application/json",
        json: payload,
      });
    });
  }

  /**
   * 3. Chặn các script theo dõi người dùng (Google Analytics, Sentry, Hotjar)
   */
  static async abortTrackingAndAnalytics(page: Page): Promise<void> {
    const trackingPatterns = [
      "**/google-analytics.com/**",
      "**/googletagmanager.com/**",
      "**/sentry.io/**",
      "**/hotjar.com/**",
      "**/facebook.net/**",
    ];

    for (const pattern of trackingPatterns) {
      await page.route(pattern, async (route) => {
        await route.abort("blockedbyclient");
      });
    }
  }

  /**
   * 4. Chặn tải hình ảnh và media nặng giúp bài test chạy siêu tốc
   */
  static async abortMediaAndImages(page: Page): Promise<void> {
    await page.route(
      "**/*.{png,jpg,jpeg,webp,gif,svg,ico,mp4,webm}",
      async (route) => {
        await route.abort("blockedbyclient");
      },
    );
  }

  /**
   * 5. Tiêm Header bổ sung vào request đang bay đi (Feature Flag, Custom Header)
   */
  static async injectHeader(
    page: Page,
    urlPattern: string,
    headerName: string,
    headerValue: string,
  ): Promise<void> {
    await page.route(urlPattern, async (route) => {
      const headers = {
        ...route.request().headers(),
        [headerName.toLowerCase()]: headerValue,
      };
      await route.continue({ headers });
    });
  }

  /**
   * 6. Giả lập độ trễ mạng (Network Latency Injection)
   */
  static async injectLatency(
    page: Page,
    urlPattern: string,
    delayMs: number,
  ): Promise<void> {
    await page.route(urlPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * 7. Response Tampering: Bắt gói tin thật từ Backend và tráo đổi payload
   */
  static async modifyJsonResponse<T>(
    page: Page,
    urlPattern: string,
    modifier: (originalData: T) => T,
  ): Promise<void> {
    await page.route(urlPattern, async (route) => {
      // Gọi fetch ra server thật để lấy dữ liệu gốc
      const response = await route.fetch();
      const originalJson: T = await response.json();

      // Can thiệp sửa đổi dữ liệu theo hàm modifier
      const modifiedJson = modifier(originalJson);

      // Trả dữ liệu đã can thiệp về trình duyệt
      await route.fulfill({
        response,
        json: modifiedJson,
      });
    });
  }
}
