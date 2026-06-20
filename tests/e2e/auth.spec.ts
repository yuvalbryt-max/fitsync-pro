import { test, expect } from '@playwright/test'

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 })
})

test('login page shows Hebrew email form', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.getByText('FitSync Pro')).toBeVisible()
  await expect(page.getByPlaceholder('כתובת אימייל')).toBeVisible()
})
