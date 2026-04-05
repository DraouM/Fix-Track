export interface SearchableItem<T> {
  original: T;
  searchString: string;
}

/**
 * Tokenizes a text string into an array of lowercase words.
 * Trims whitespace and splits by spaces, keeping hyphens and other characters intact.
 * @param text The input string
 * @returns Array of lowercase tokens
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/**
 * Pre-processes a list of items to cache their search strings.
 * This satisfies O(n) performance rules for large arrays.
 * @param items The raw array of items
 * @param getFields A function returning an array of string fields to search against
 * @returns An array of SearchableItem objects
 */
export function prepareSearchableItems<T>(
  items: T[],
  getFields: (item: T) => (string | undefined | null)[]
): SearchableItem<T>[] {
  return items.map((item) => {
    // Extract fields, filter out null/undefined, convert to string
    const fields = getFields(item).filter(Boolean) as string[];
    return {
      original: item,
      // Join fields with space, trim and lowercase to create the cache
      searchString: fields.join(" ").toLowerCase().trim(),
    };
  });
}

/**
 * Performs a flexible and reverse search algorithms over pre-processed items.
 * A query token matches if it exists as a substring anywhere in the cached search string.
 * @param query The user's input search query
 * @param searchableItems The pre-processed items
 * @returns The original items that match the search query
 */
export function searchSearchableItems<T>(
  query: string,
  searchableItems: SearchableItem<T>[]
): T[] {
  const queryTokens = tokenize(query);
  
  // Edge case: Empty query returns all items
  if (queryTokens.length === 0) return searchableItems.map((i) => i.original);

  return searchableItems
    .filter((item) => {
      // Every query token must be included as a substring in the search string
      return queryTokens.every((qToken) => item.searchString.includes(qToken));
    })
    .map((item) => item.original);
}

/**
 * Convenience function for searching without pre-computation caching if the list is small.
 * Not recommended for very large lists inside React re-renders.
 */
export function flexibleSearch<T>(
  query: string,
  items: T[],
  getFields: (item: T) => (string | undefined | null)[]
): T[] {
  const searchable = prepareSearchableItems(items, getFields);
  return searchSearchableItems(query, searchable);
}

// ---------------------------------------------------------
// TEST CASES
// ---------------------------------------------------------
export function runFlexibleSearchTests() {
  const items = [
    { name: "Wireless Bluetooth Headphones Sony WH-1000XM5", id: "1" },
    { name: "Apple iPhone 14 Pro Max Case", id: "2" },
    { name: "Samsung Galaxy S23 Ultra Screen Protector", id: "3" },
  ];

  const getFields = (item: any) => [item.name];

  console.log("--- Running Flexible Search Tests ---");

  // 1. Normal Search
  const res1 = flexibleSearch("sony headphones", items, getFields);
  const pass1 = res1.length === 1 && res1[0].id === "1";
  console.assert(pass1, "Test 1 Failed: Normal Search");
  if (pass1) console.log("✅ Test 1 Passed: Normal Search");

  // 2. Reverse Word Order search
  const res2 = flexibleSearch("wh-1000xm5 sony", items, getFields);
  const pass2 = res2.length === 1 && res2[0].id === "1";
  console.assert(pass2, "Test 2 Failed: Reverse Word Order");
  if (pass2) console.log("✅ Test 2 Passed: Reverse Word Order");

  // 3. Partial / End-of-string search
  const res3 = flexibleSearch("1000", items, getFields);
  const pass3 = res3.length === 1 && res3[0].id === "1";
  console.assert(pass3, "Test 3 Failed: Partial Search");
  if (pass3) console.log("✅ Test 3 Passed: Partial Search");

  // 4. Flexible Partial on different parts
  const res4 = flexibleSearch("14 max pro", items, getFields);
  const pass4 = res4.length === 1 && res4[0].id === "2";
  console.assert(pass4, "Test 4 Failed: Flexible Partial on multiple words");
  if (pass4) console.log("✅ Test 4 Passed: Flexible Partial");
}
