import asyncio
from playwright.async_api import async_playwright

async def extract_m3u8_link(embed_url):
    """
    Navigates to the embed URL using a headless browser, monitors network requests,
    and extracts the first M3U8 playlist URL.
    """
    m3u8_link_found = asyncio.Event()
    m3u8_link = None

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        def handle_request(request):
            nonlocal m3u8_link
            if ".m3u8" in request.url:
                print(f"Found M3U8 link: {request.url}")
                m3u8_link = request.url
                if not m3u8_link_found.is_set():
                    m3u8_link_found.set()

        page.on('request', handle_request)

        try:
            print(f"Navigating to {embed_url}...")
            await page.goto(embed_url, wait_until='networkidle', timeout=60000)
            
            print("Waiting for M3U8 link...")
            try:
                await asyncio.wait_for(m3u_link_found.wait(), timeout=30)
            except asyncio.TimeoutError:
                print("Timeout: M3U8 link not found within 30 seconds.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()
            if m3u8_link:
                print(f"\nExtracted M3U8 Link: {m3u8_link}")
            else:
                print("\nCould not extract M3U8 link.")


if __name__ == "__main__":
    # Replace this with the actual embed URL you want to process
    EMBED_URL = "https://dood.yt/e/EXAMPLE_VIDEO_ID"
    
    # To run this script, you need to have playwright installed:
    # pip install playwright
    # And you need to install the browser binaries:
    # playwright install
    
    asyncio.run(extract_m3u8_link(EMBED_URL))
