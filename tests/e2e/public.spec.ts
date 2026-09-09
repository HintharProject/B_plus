import { expect, test } from "@playwright/test";

test("loads the Burmese-first landing page and can switch language", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "my");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ကိုယ်ရေးအချက်အလက်");
  await page.getByLabel("ဘာသာစကား").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find willing donors");
});

test("does not pretend auth works before Firebase configuration", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/Firebase မသတ်မှတ်ရသေးပါ/)).toBeVisible();
  await expect(page.getByRole("button", { name: "အကောင့်ဝင်မည်" })).toBeDisabled();
});
