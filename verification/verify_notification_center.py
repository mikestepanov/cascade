from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to home
        try:
            page.goto("http://localhost:5555", timeout=10000)
            time.sleep(2) # Wait for potential redirects

            # Take screenshot of whatever we see (Login or Home)
            page.screenshot(path="verification/initial_load.png")
            print("Screenshot taken: initial_load.png")

            # Try to find the notification bell (aria-label="Notifications" or similar)
            # The code uses dynamic label: "Notifications" or "Notifications, X unread"
            # We look for a button with label starting with "Notifications"
            bell = page.get_by_label("Notifications", exact=False)

            if bell.count() > 0:
                bell.first.click()
                time.sleep(1)
                page.screenshot(path="verification/bell_clicked.png")
                print("Screenshot taken: bell_clicked.png")
            else:
                print("Notification bell not found (likely not logged in)")

        except Exception as e:
            print(f"Error: {e}")

        browser.close()

if __name__ == "__main__":
    run()
