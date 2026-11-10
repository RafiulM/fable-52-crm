import { expect, test } from "@playwright/test";

const protectedPaths = [
  "/dashboard",
  "/transaksi",
  "/leads",
  "/target",
  "/laporan",
  "/tim",
  "/pengaturan",
];

test("anonymous visitors cannot access the protected app", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  const session = await request.get("/api/auth/get-session");
  expect(await session.json()).toBeNull();

  // The proxy answers with a real redirect before any page is rendered.
  for (const path of protectedPaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/sign-in$/);
  }
});

test("a forged session cookie passes the proxy but still reaches no data", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "ngodingpakeai-postgres.session_token",
      value: "forged.forged",
      url: "http://localhost:3101",
    },
  ]);
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
  expect((await context.request.get("/api/dashboard")).status()).toBe(401);
  await context.close();
});

test("signup, persisted session, signout, rejected password, and signin work", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `builder-${Date.now()}@example.com`;
  const password = "A-long-test-password-123!";
  await page.goto("/sign-up");
  await page.getByLabel("Nama", { exact: true }).fill("Ada Builder");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Ada Builder")).toBeVisible();
  const cookies = await context.cookies();
  expect(
    cookies.some(
      (cookie) => cookie.name.includes("session_token") && cookie.httpOnly,
    ),
  ).toBe(true);
  // Signed-in visitors skip the sign-in page and the home page.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("button", { name: "Keluar dari akun", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("incorrect-password");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  // Next.js keeps its own route announcer as a second alert region.
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Email atau kata sandi tidak cocok" }),
  ).toBeVisible();
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(errors).toEqual([]);
});

test("the auth forms explain empty and invalid fields without sending them", async ({
  page,
}) => {
  await page.goto("/sign-up");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page.getByText("Isi nama kamu.")).toBeVisible();
  await expect(
    page.getByText("Isi email dengan format nama@domain.com."),
  ).toBeVisible();
  await expect(page.getByText("Isi kata sandi.")).toBeVisible();
  await expect(page.getByLabel("Nama", { exact: true })).toBeFocused();

  await page.getByLabel("Nama", { exact: true }).fill("Ada Builder");
  await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await page.getByLabel("Kata sandi", { exact: true }).fill("pendek");
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page.getByText("Kata sandi minimal 8 karakter.")).toBeVisible();
  // Nothing was submitted, and typed values never reach the address bar.
  await expect(page).toHaveURL(/\/sign-up$/);
});

test("auth rejects cross-origin requests and invalid signup data", async ({
  request,
}) => {
  const crossOrigin = await request.post("/api/auth/sign-up/email", {
    headers: { Origin: "https://untrusted.example" },
    data: {
      name: "Test",
      email: "cross-origin@example.com",
      password: "Test-password-123",
    },
  });
  expect(crossOrigin.status()).toBe(403);
  const invalid = await request.post("/api/auth/sign-up/email", {
    headers: { Origin: "http://localhost:3101" },
    data: { name: "Test", email: "not-an-email", password: "short" },
  });
  expect(invalid.status()).toBeGreaterThanOrEqual(400);
  expect(invalid.status()).toBeLessThan(500);
});

test("the home and auth pages fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Anonymous visitors land on the sign-in page.
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Buat akun", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Buat akun" })).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("an unknown address shows the not-found page", async ({ page }) => {
  const response = await page.goto("/halaman-yang-tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Halaman ini tidak ada" }),
  ).toBeVisible();
});
