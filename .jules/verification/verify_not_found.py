from playwright.sync_api import sync_playwright

def verify_not_found_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to a non-existent page to trigger 404
        # Assuming the router handles this, or I can try to find where NotFoundPage is used.
        # But if it's not mounted, I can't see it.
        # However, usually there is a catch-all route.
        # Let's try /404 or /some-random-page
        page.goto("http://localhost:5555/some-random-page-xyz-123")

        # Wait for the page to load
        page.wait_for_load_state("networkidle")

        # Take screenshot
        page.screenshot(path=".jules/verification/not-found-page.png")

        browser.close()

if __name__ == "__main__":
    verify_not_found_page()
