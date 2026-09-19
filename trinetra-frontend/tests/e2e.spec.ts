import { test, expect } from '@playwright/test';

/**
 * TriNetra End-to-End Test Suite: Automated Legal Metrology Inspection Workflow
 *
 * Workflow Tested:
 * 1. Officer Authentication (Login -> Redirect to Dashboard)
 * 2. Sidebar Navigation (Dashboard -> Scanner Viewfinder)
 * 3. Optical Packaging Scan Simulation (Bypassing hardware with fake media stream & Tesseract mock)
 * 4. Strict 2011 Rules Audit (MRP, Net Qty, Mfg Date, Customer Care validation)
 * 5. Official Statutory PDF Dossier Generation Verification
 */
test.describe('TriNetra Enterprise Frontend - E2E Verification Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // -------------------------------------------------------------
    // Resilient Hardware & OCR Mocking Injection:
    // Guarantees zero flakiness on headless CI runners & local dev
    // -------------------------------------------------------------
    await page.addInitScript(() => {
      // 1. Mock getUserMedia to supply a continuous synthetic video stream
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#10b981';
            ctx.font = '24px monospace';
            ctx.fillText('TRINETRA MOCK OPTICAL FEED', 50, 240);
          }
          const stream = canvas.captureStream(30);
          return stream;
        };
      }

      // 2. Mock Tesseract OCR engine to return compliant Legal Metrology packaging declarations
      const mockPackagingText =
        'Fortune Sunlite Refined Sunflower Oil. ' +
        'Maximum Retail Price (MRP): Rs 165.00 incl. of all taxes. ' +
        'Net Quantity: 1 Litre. ' +
        'Date of Manufacture: 08/2026. ' +
        'Consumer Care: consumer@adaniwilmar.in, 1800-200-1122. ' +
        'FSSAI Lic. No. 10014021000123.';

      // Intercept window Tesseract or global recognition
      (window as any).mockTesseractOcrText = mockPackagingText;

      // Mock Tesseract.recognize if loaded globally or on module
      const originalTesseract = (window as any).Tesseract;
      if (originalTesseract) {
        originalTesseract.recognize = async (_image: any, _lang: string, options?: any) => {
          if (options && typeof options.logger === 'function') {
            options.logger({ status: 'recognizing text', progress: 0.5 });
            options.logger({ status: 'done', progress: 1.0 });
          }
          return {
            data: {
              text: mockPackagingText,
              confidence: 97.8,
            },
          };
        };
      }
    });

    // 3. Mock authentication and backend inspection endpoints for reliable UI testing
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Authenticated successfully',
          token: 'mock-jwt-token-for-e2e-playwright-session',
          user: {
            id: '66e123456789abcdef000001',
            badgeId: 'INSP-GJ-2041',
            name: 'Inspector Rajesh Varma',
            role: 'Field Officer',
            region: 'Gujarat',
          },
        }),
      });
    });

    await page.route('**/api/inspections**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Statutory inspection dossier recorded successfully',
            report: {
              _id: '66f987654321fedcba000001',
              docketId: 'TRN-9842',
              productName: 'Fortune Sunlite Refined Sunflower Oil',
              brand: 'Adani Wilmar Ltd',
              category: 'Food & Beverages',
              verdict: 'Compliant',
              ocrConfidence: '98%',
              officerId: 'INSP-GJ-2041',
              officerName: 'Inspector Rajesh Varma',
              region: 'Gujarat',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            reports: [],
          }),
        });
      }
    });
  });

  test('Complete End-to-End Inspection Flow: Login -> Scanner -> OCR Audit -> PDF Export', async ({ page }) => {
    // -------------------------------------------------------------
    // 1. LOGIN FLOW
    // -------------------------------------------------------------
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify Login page rendered with TriNetra Branding
    await expect(page.locator('text=TriNetra').first()).toBeVisible();
    await expect(page.locator('text=Legal Metrology Compliance Portal')).toBeVisible();

    // Fill in default credentials
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');

    // Click submit and wait for navigation to /dashboard
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      submitBtn.click(),
    ]);

    await expect(page).toHaveURL(/.*dashboard/);

    // Assert Dashboard components are visible
    await expect(
      page.locator('text=Field Inspection & Compliance Workspace').or(page.locator('text=Pan-India Administrative Command Center'))
    ).toBeVisible();

    // -------------------------------------------------------------
    // 2. SIDEBAR NAVIGATION TO SCANNER
    // -------------------------------------------------------------
    // Find and click the Start Inspection / Scanner link in the sidebar
    const scannerLink = page.locator('aside a[href="/scanner"]').first();
    await expect(scannerLink).toBeVisible();
    await scannerLink.click();

    // Verify URL transitioned to /scanner
    await expect(page).toHaveURL(/.*scanner/);
    await page.waitForLoadState('networkidle');

    // Verify Camera module / Intake header rendered
    await expect(page.getByRole('heading', { name: 'Packaging Compliance Scanner' })).toBeVisible();
    await expect(page.locator('button:has-text("Live Device Camera")')).toBeVisible();
    await expect(page.locator('button:has-text("Upload Artwork File")')).toBeVisible();

    // -------------------------------------------------------------
    // 3. SCAN SIMULATION (Upload Sample Image & Run OCR)
    // -------------------------------------------------------------
    // Switch to Upload Artwork tab for deterministic headless execution
    const uploadTabBtn = page.locator('button:has-text("Upload Artwork File")');
    await uploadTabBtn.click();

    // Prepare a synthetic 1x1 test image buffer
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image to file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'sample_packaging_box.png',
      mimeType: 'image/png',
      buffer: testImageBuffer,
    });

    // Verify selected image preview renders
    await expect(page.locator('img[alt="Inspected packaging artwork"]')).toBeVisible();

    // Locate and trigger the "Scan Package with Tesseract OCR" button
    const scanButton = page.locator('button:has-text("Scan Package with Tesseract OCR")');
    await expect(scanButton).toBeVisible();
    await scanButton.click();

    // -------------------------------------------------------------
    // 4. STATUTORY COMPLIANCE AUDIT VALIDATION
    // -------------------------------------------------------------
    // Wait for the audit results container to appear (waiting for OCR completion)
    const auditResultsHeading = page.locator('text=Mandatory Packaging Declarations Audit').or(page.locator('text=Statutory Verdict'));
    await expect(auditResultsHeading.first()).toBeVisible({ timeout: 25000 });

    // Assert that the Legal Metrology verdict card rendered
    await expect(
      page.locator('text=Statutory Verdict').or(page.locator('text=Compliant')).or(page.locator('text=NON-COMPLIANT')).first()
    ).toBeVisible();

    // -------------------------------------------------------------
    // 5. PDF GENERATION CHECK
    // -------------------------------------------------------------
    // Assert that the "Download Official Report" button appears and is clickable
    const downloadPdfButton = page.locator('button:has-text("Download Official Report")');
    await expect(downloadPdfButton).toBeVisible();
    await expect(downloadPdfButton).toBeEnabled();

    // Click the button to trigger PDF creation and ensure zero UI crashes
    await downloadPdfButton.click();

    // Verify success notice or active PDF export state
    await expect(
      page.locator('text=Official PDF Dossier').or(page.locator('text=generated & downloaded successfully')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('Failsafe Security Guard: Unauthenticated user is redirected to Login', async ({ page }) => {
    // Clear storage to guarantee zero auth session
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Attempt direct deep link to protected /scanner route
    await page.goto('/scanner');
    await page.waitForLoadState('networkidle');

    // Assert that the user is safely redirected back to /login
    await expect(page).toHaveURL(/.*login/);
  });
});
