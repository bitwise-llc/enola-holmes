import json
import csv
import time
import requests

API_KEY = "d9511e10a5bb272420ac58a4d75570fb29fc4d58a77dc1ce89f7de9dc6a1f675"
PRODUCT_ID = "6745106241"  # Sherlock
COUNTRY = "us"
SORT = "mostrecent"

BASE_URL = "https://serpapi.com/search.json"


def fetch_page(page: int):
    params = {
        "engine": "apple_reviews",
        "product_id": PRODUCT_ID,
        "country": COUNTRY,
        "sort": SORT,
        "page": page,
        "api_key": API_KEY,
    }

    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()
    return response.json()


def scrape_all_reviews():
    all_reviews = []

    # First page
    data = fetch_page(1)

    total_pages = data["search_information"]["total_page_count"]
    print(f"Found {total_pages} pages")

    all_reviews.extend(data.get("reviews", []))

    # Remaining pages
    for page in range(2, total_pages + 1):
        print(f"Fetching page {page}/{total_pages}")
        data = fetch_page(page)
        all_reviews.extend(data.get("reviews", []))
        time.sleep(0.3)  # avoid hammering the API

    return all_reviews


if __name__ == "__main__":
    reviews = scrape_all_reviews()

    print(f"Downloaded {len(reviews)} reviews")

    # Save as CSV
    if reviews:
        # Extract all possible keys from all reviews
        fieldnames = set()
        for review in reviews:
            fieldnames.update(review.keys())
        fieldnames = sorted(fieldnames)

        with open("reviews-stalkie.csv", "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(reviews)

        print("Saved to reviews.csv")

    # Also save as JSON for backup
    with open("reviews-stalkie.json", "w", encoding="utf-8") as f:
        json.dump(reviews, f, ensure_ascii=False, indent=2)

    print("Saved to reviews.json")