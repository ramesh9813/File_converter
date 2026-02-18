import os
import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to page
    try:
        page.goto("http://localhost:3000")
    except Exception as e:
        print(f"Failed to load page: {e}")
        # Try to wait a bit and retry
        time.sleep(5)
        try:
             page.goto("http://localhost:3000")
        except Exception as e2:
             print(f"Retry failed: {e2}")
             browser.close()
             return

    # Check content
    # Wait for h1
    try:
        page.wait_for_selector("h1", timeout=5000)
    except:
        print("h1 not found")
        print(page.content())

    # Upload file
    # Ensure test file exists
    test_file_path = "/app/my-app/test.md"
    if not os.path.exists(test_file_path):
        with open(test_file_path, "w") as f:
            f.write("# Hello World\nThis is a test.")

    file_input = page.locator("input[type='file']")
    file_input.set_input_files(test_file_path)

    # Wait for format select to appear
    try:
        page.wait_for_selector("select", timeout=5000)
    except:
        print("Select not found after file upload")
        print(page.content())
        browser.close()
        return

    # Select format
    page.select_option("select", "html")

    # Click convert
    page.click("button:has-text('Convert')")

    # Wait for success
    try:
        page.wait_for_selector("text=Conversion Successful!", timeout=10000)
    except Exception as e:
        print("Conversion failed or timed out")
        # print(page.content()) # might be too large

    # Screenshot
    os.makedirs("verification", exist_ok=True)
    page.screenshot(path="verification/conversion_success.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
