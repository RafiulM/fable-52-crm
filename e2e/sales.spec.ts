import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";

const origin = "http://localhost:3101";
const headers = { Origin: origin };

// Business dates follow the app's time zone, not the machine's.
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
}).format(new Date());
const month = today.slice(0, 7);
const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000)
  .toISOString()
  .slice(0, 10);

async function signUp(client: APIRequestContext, name = "Pemilik Tim") {
  const data = {
    name,
    email: `sales-${randomUUID()}@example.com`,
    password: "Sales-test-password-123!",
  };
  let response = await client.post("/api/auth/sign-up/email", {
    headers,
    data,
  });
  if (response.status() === 429) {
    // The real auth server limits rapid signups. Honor its retry window once.
    const seconds = Number(response.headers()["retry-after"] || 10);
    expect(Number.isFinite(seconds) && seconds >= 0 && seconds <= 10).toBe(
      true,
    );
    await delay((seconds + 0.1) * 1000);
    response = await client.post("/api/auth/sign-up/email", { headers, data });
  }
  expect(response.status()).toBe(200);
}

async function createMember(client: APIRequestContext, name: string) {
  const response = await client.post("/api/sales-members", {
    headers,
    data: { name },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data as { id: string; name: string };
}

async function createTransaction(
  client: APIRequestContext,
  salesMemberId: string,
  amount: number,
) {
  const response = await client.post("/api/transactions", {
    headers,
    data: { salesMemberId, amount, transactionDate: today },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data as { id: string; amount: number };
}

async function summary(client: APIRequestContext) {
  const response = await client.get("/api/dashboard/summary?period=today");
  expect(response.status()).toBe(200);
  return (await response.json()).data;
}

test("every sales endpoint requires a real session and returns JSON errors", async ({
  request,
}) => {
  const id = randomUUID();
  for (const [method, url] of [
    ["GET", "/api/dashboard"],
    ["GET", "/api/dashboard/summary"],
    ["GET", "/api/dashboard/sales-comparison"],
    ["GET", "/api/dashboard/week-trend"],
    ["GET", "/api/dashboard/daily-trend"],
    ["GET", "/api/transactions"],
    ["POST", "/api/transactions"],
    ["GET", `/api/transactions/${id}`],
    ["PATCH", `/api/transactions/${id}`],
    ["DELETE", `/api/transactions/${id}`],
    ["GET", "/api/leads"],
    ["POST", "/api/leads"],
    ["GET", `/api/leads/${id}`],
    ["PATCH", `/api/leads/${id}`],
    ["GET", "/api/leads/conversion"],
    ["GET", `/api/targets?mode=daily&date=${today}`],
    ["PUT", "/api/targets"],
    ["GET", "/api/reports"],
    ["GET", "/api/sales-members"],
    ["POST", "/api/sales-members"],
    ["PATCH", `/api/sales-members/${id}`],
    ["GET", "/api/profile"],
    ["PATCH", "/api/profile"],
  ]) {
    const response = await request.fetch(url, { method, headers });
    expect(response.status(), `${method} ${url}`).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHORIZED");
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});

test("recorded sales, leads, and targets flow into the dashboard and report", async ({
  request,
}) => {
  await signUp(request);
  const empty = await summary(request);
  expect(empty.today).toEqual({ amount: 0, count: 0, leads: 0 });

  const ayu = await createMember(request, "  Ayu Lestari  ");
  expect(ayu.name).toBe("Ayu Lestari");
  const bima = await createMember(request, "Bima Sakti");
  const first = await createTransaction(request, ayu.id, 1_500_000);
  await createTransaction(request, bima.id, 500_000);
  expect(first).not.toHaveProperty("userId");

  expect((await summary(request)).today).toMatchObject({
    amount: 2_000_000,
    count: 2,
  });
  const list = await (await request.get("/api/transactions")).json();
  expect(list.meta).toMatchObject({ total: 2, totalAmount: 2_000_000 });
  const onlyAyu = await (
    await request.get(`/api/transactions?salesMemberId=${ayu.id}`)
  ).json();
  expect(onlyAyu.data.map((row: { id: string }) => row.id)).toEqual([first.id]);

  // Editing a transaction changes the totals; nothing else is rewritten.
  const edited = await request.patch(`/api/transactions/${first.id}`, {
    headers,
    data: { amount: 2_000_000 },
  });
  expect(edited.status()).toBe(200);
  expect((await edited.json()).data).toMatchObject({
    amount: 2_000_000,
    salesMemberId: ayu.id,
    transactionDate: today,
  });
  expect((await summary(request)).today.amount).toBe(2_500_000);

  const comparison = await (
    await request.get("/api/dashboard/sales-comparison?period=today")
  ).json();
  expect(JSON.stringify(comparison.data)).toContain("Ayu Lestari");

  // A daily target is compared with what that sales achieved on the day.
  const saved = await request.put("/api/targets", {
    headers,
    data: {
      mode: "daily",
      date: today,
      targets: [{ salesMemberId: ayu.id, amount: 4_000_000 }],
    },
  });
  expect(saved.status()).toBe(200);
  const board = await (
    await request.get(`/api/targets?mode=daily&date=${today}`)
  ).json();
  expect(
    board.data.find((row: { salesId: string }) => row.salesId === ayu.id),
  ).toMatchObject({ target: 4_000_000, achieved: 2_000_000 });
  const monthly = await request.put("/api/targets", {
    headers,
    data: {
      mode: "monthly",
      month,
      targets: [{ salesMemberId: bima.id, amount: 30_000_000 }],
    },
  });
  expect(monthly.status()).toBe(200);
  const monthBoard = await (
    await request.get(`/api/targets?mode=monthly&month=${month}`)
  ).json();
  expect(
    monthBoard.data.find((row: { salesId: string }) => row.salesId === bima.id),
  ).toMatchObject({ target: 30_000_000, achieved: 500_000 });

  // A lead counts as converted once its status becomes "jadi_beli".
  const lead = await request.post("/api/leads", {
    headers,
    data: { salesMemberId: ayu.id, name: "Toko Maju Jaya" },
  });
  expect(lead.status()).toBe(201);
  const { data: createdLead } = await lead.json();
  expect(createdLead).toMatchObject({ status: "baru", leadDate: today });
  const won = await request.patch(`/api/leads/${createdLead.id}`, {
    headers,
    data: { status: "jadi_beli" },
  });
  expect(won.status()).toBe(200);
  const conversion = await (
    await request.get("/api/leads/conversion?period=month")
  ).json();
  expect(
    conversion.data.find((row: { salesId: string }) => row.salesId === ayu.id),
  ).toMatchObject({ total: 1, won: 1 });
  expect((await summary(request)).monthLeads).toEqual({ total: 1, won: 1 });

  const report = await (await request.get("/api/reports?period=today")).json();
  expect(report.data.totals.current).toEqual({
    amount: 2_500_000,
    count: 2,
    leads: 1,
    won: 1,
  });

  // A deactivated member keeps their history but cannot take new records.
  const deactivated = await request.patch(`/api/sales-members/${bima.id}`, {
    headers,
    data: { isActive: false },
  });
  expect(deactivated.status()).toBe(200);
  const refused = await request.post("/api/transactions", {
    headers,
    data: { salesMemberId: bima.id, amount: 100_000, transactionDate: today },
  });
  expect(refused.status()).toBe(422);
  expect((await refused.json()).error.code).toBe("SALES_MEMBER_UNAVAILABLE");
  expect(
    (
      await request.post("/api/leads", {
        headers,
        data: { salesMemberId: bima.id, name: "Tidak boleh masuk" },
      })
    ).status(),
  ).toBe(422);
  expect((await summary(request)).today.amount).toBe(2_500_000);
  const active = await (
    await request.get("/api/sales-members?status=active")
  ).json();
  expect(active.data.map((row: { id: string }) => row.id)).toEqual([ayu.id]);

  const deleted = await request.delete(`/api/transactions/${first.id}`, {
    headers,
  });
  expect(deleted.status()).toBe(204);
  expect((await request.get(`/api/transactions/${first.id}`)).status()).toBe(
    404,
  );
  expect((await summary(request)).today).toMatchObject({
    amount: 500_000,
    count: 1,
  });
});

test("one account cannot see, change, or borrow another account's sales data", async ({
  request,
  playwright,
}) => {
  await signUp(request, "Pemilik Asli");
  const member = await createMember(request, "Citra Dewi");
  const transaction = await createTransaction(request, member.id, 750_000);
  const lead = await request.post("/api/leads", {
    headers,
    data: { salesMemberId: member.id, name: "Lead Rahasia" },
  });
  expect(lead.status()).toBe(201);
  const leadId = (await lead.json()).data.id;
  const renamed = await request.patch("/api/profile", {
    headers,
    data: { teamName: "Tim Asli" },
  });
  expect(renamed.status()).toBe(200);

  const stranger = await playwright.request.newContext({ baseURL: origin });
  try {
    await signUp(stranger, "Orang Lain");
    for (const url of ["/api/transactions", "/api/leads", "/api/sales-members"])
      expect((await (await stranger.get(url)).json()).data, url).toEqual([]);
    expect((await summary(stranger)).today).toEqual({
      amount: 0,
      count: 0,
      leads: 0,
    });
    expect((await (await stranger.get("/api/profile")).json()).data).toEqual(
      expect.objectContaining({ name: "Orang Lain", teamName: "Tim Sales" }),
    );

    for (const [method, url, data] of [
      ["GET", `/api/transactions/${transaction.id}`, undefined],
      ["PATCH", `/api/transactions/${transaction.id}`, { amount: 1 }],
      ["DELETE", `/api/transactions/${transaction.id}`, undefined],
      ["GET", `/api/leads/${leadId}`, undefined],
      ["PATCH", `/api/leads/${leadId}`, { status: "gagal" }],
      ["PATCH", `/api/sales-members/${member.id}`, { isActive: false }],
    ] as const) {
      const response = await stranger.fetch(url, {
        method,
        headers,
        ...(data ? { data } : {}),
      });
      expect(response.status(), `${method} ${url}`).toBe(404);
    }

    // Another account's member cannot be attached to new records either.
    for (const [method, url, data] of [
      [
        "POST",
        "/api/transactions",
        { salesMemberId: member.id, amount: 1_000, transactionDate: today },
      ],
      ["POST", "/api/leads", { salesMemberId: member.id, name: "Titipan" }],
      [
        "PUT",
        "/api/targets",
        {
          mode: "daily",
          date: today,
          targets: [{ salesMemberId: member.id, amount: 1_000 }],
        },
      ],
    ] as const) {
      const response = await stranger.fetch(url, { method, headers, data });
      expect(response.status(), `${method} ${url}`).toBe(422);
      expect((await response.json()).error.code).toBe(
        "SALES_MEMBER_UNAVAILABLE",
      );
    }
    const massAssignment = await stranger.post("/api/sales-members", {
      headers,
      data: { name: "Titipan", userId: "someone-else" },
    });
    expect(massAssignment.status()).toBe(422);

    // The owner's data is exactly as they left it.
    expect(
      (await (await request.get(`/api/transactions/${transaction.id}`)).json())
        .data.amount,
    ).toBe(750_000);
    expect(
      (await (await request.get(`/api/leads/${leadId}`)).json()).data.status,
    ).toBe("baru");
    expect(
      (await (await request.get("/api/sales-members")).json()).data[0].isActive,
    ).toBe(true);
    const board = await (
      await request.get(`/api/targets?mode=daily&date=${today}`)
    ).json();
    expect(board.data[0]).toMatchObject({ target: 0, achieved: 750_000 });
  } finally {
    await stranger.dispose();
  }
});

test("sales endpoints reject invalid input and unsafe mutation origins", async ({
  request,
}) => {
  await signUp(request);
  const member = await createMember(request, "Dian Permata");
  const valid = {
    salesMemberId: member.id,
    amount: 1_000,
    transactionDate: today,
  };
  for (const data of [
    {},
    { ...valid, amount: 0 },
    { ...valid, amount: -5 },
    { ...valid, amount: 1_000.5 },
    { ...valid, amount: "1000" },
    { ...valid, transactionDate: tomorrow },
    { ...valid, transactionDate: "2026-02-30" },
    { ...valid, salesMemberId: "not-a-uuid" },
    { ...valid, unexpected: true },
  ]) {
    const response = await request.post("/api/transactions", { headers, data });
    expect(response.status(), JSON.stringify(data)).toBe(422);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  }
  for (const [method, url, data] of [
    ["POST", "/api/sales-members", { name: "   " }],
    ["POST", "/api/sales-members", { name: "Eko", phone: "123" }],
    ["PATCH", `/api/sales-members/${member.id}`, {}],
    ["POST", "/api/leads", { salesMemberId: member.id, name: "" }],
    [
      "POST",
      "/api/leads",
      { salesMemberId: member.id, name: "Lead", status: "menang" },
    ],
    ["PUT", "/api/targets", { mode: "daily", date: today, targets: [] }],
    [
      "PUT",
      "/api/targets",
      {
        mode: "monthly",
        month: "2026-13",
        targets: [{ salesMemberId: member.id, amount: 1 }],
      },
    ],
    [
      "PUT",
      "/api/targets",
      {
        mode: "daily",
        date: today,
        targets: [{ salesMemberId: member.id, amount: -1 }],
      },
    ],
    ["PATCH", "/api/profile", {}],
    ["PATCH", "/api/profile", { teamName: "  " }],
    ["PATCH", "/api/profile", { email: "lain@example.com" }],
  ] as const) {
    const response = await request.fetch(url, { method, headers, data });
    expect(response.status(), `${method} ${url} ${JSON.stringify(data)}`).toBe(
      422,
    );
  }
  for (const url of [
    "/api/transactions/not-a-uuid",
    "/api/transactions?limit=101",
    "/api/transactions?from=kemarin",
    "/api/leads?status=menang",
    "/api/dashboard/sales-comparison?period=tahun",
    "/api/targets?mode=daily",
    `/api/reports?period=custom&from=${today}`,
    `/api/reports?period=custom&from=${today}&to=2020-01-01`,
    `/api/reports?period=custom&from=${today}&to=${tomorrow}`,
    "/api/sales-members?status=semua",
  ])
    expect((await request.get(url)).status(), url).toBe(422);

  const invalidOrigins: Record<string, string>[] = [
    { Origin: "https://untrusted.example" },
    {},
    { ...headers, "Sec-Fetch-Site": "cross-site" },
  ];
  for (const requestHeaders of invalidOrigins) {
    for (const [method, url, data] of [
      ["POST", "/api/transactions", valid],
      ["POST", "/api/sales-members", { name: "Tidak tersimpan" }],
      ["PATCH", "/api/profile", { teamName: "Tidak tersimpan" }],
    ] as const) {
      const response = await request.fetch(url, {
        method,
        headers: requestHeaders,
        data,
      });
      expect(response.status(), `${method} ${url}`).toBe(403);
    }
  }
  expect((await (await request.get("/api/transactions")).json()).data).toEqual(
    [],
  );
  expect(
    (await (await request.get("/api/sales-members")).json()).data,
  ).toHaveLength(1);
});

test("the owner adds a member, records a sale, renames the team, and signs out", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // The browser shares cookies with page.request, so this signs the page in.
  await signUp(page.request, "Rina Pemilik");

  await page.goto("/tim");
  await expect(page.getByText("Belum ada anggota tim sales.")).toBeVisible();
  await page.getByRole("button", { name: "Tambah anggota" }).click();
  const memberDialog = page.getByRole("dialog");
  await memberDialog.getByRole("button", { name: "Tambah anggota" }).click();
  await expect(memberDialog.getByText("Isi nama anggota.")).toBeVisible();
  await memberDialog.getByLabel("Nama anggota").fill("Gilang Ramadhan");
  await memberDialog.getByRole("button", { name: "Tambah anggota" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator("td", { hasText: "Gilang Ramadhan" }),
  ).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Belum ada transaksi hari ini.")).toBeVisible();
  await page.getByRole("button", { name: "Catat penjualan" }).click();
  const saleDialog = page.getByRole("dialog");
  await saleDialog
    .getByLabel("Sales", { exact: true })
    .selectOption({ label: "Gilang Ramadhan" });
  await saleDialog.getByLabel("Nominal penjualan").fill("1250000");
  await saleDialog.getByLabel("Produk atau keterangan").fill("Paket Uji");
  await saleDialog.getByRole("button", { name: "Simpan transaksi" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/Transaksi Rp\s1\.250\.000 untuk/)).toBeVisible();
  await expect(page.getByText("Belum ada transaksi hari ini.")).toHaveCount(0);
  await expect(page.getByText("Paket Uji")).toBeVisible();
  const saved = await (await page.request.get("/api/transactions")).json();
  expect(saved.meta).toMatchObject({ total: 1, totalAmount: 1_250_000 });

  await page.goto("/pengaturan");
  await page.getByLabel("Nama tim").fill("Tim Uji E2E");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Profil tersimpan.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nama tim")).toHaveValue("Tim Uji E2E");
  await expect(page.getByText("Tim Uji E2E")).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("button", { name: "Keluar dari akun" })
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect((await page.request.get("/api/profile")).status()).toBe(401);
  expect(errors).toEqual([]);
});

test("the sales pages fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signUp(page.request, "Layar Kecil");
  const member = await createMember(page.request, "Hana Wulandari");
  await createTransaction(page.request, member.id, 3_400_000);
  for (const [path, heading] of [
    ["/dashboard", "Dashboard"],
    ["/transaksi", "Catat Penjualan"],
    ["/leads", "Leads"],
    ["/target", "Target"],
    ["/laporan", "Laporan"],
    ["/tim", "Tim Sales"],
    ["/pengaturan", "Pengaturan"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
      path,
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `${path} must not scroll sideways`,
    ).toBe(true);
  }
});
