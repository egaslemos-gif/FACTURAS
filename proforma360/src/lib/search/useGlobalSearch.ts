import { useMemo, useState, useEffect } from "react";
import { useQuotationsStore, useClientsStore, useProductsStore } from "@/stores";
import { buildSearchIndex, rankRecentItems, SearchItem } from "./searchIndex";
import { SearchEngine } from "./searchEngine";
import { useRouter } from "next/navigation";

export function useGlobalSearch() {
  const router = useRouter();
  const { quotations } = useQuotationsStore();
  const { clients } = useClientsStore();
  const { products } = useProductsStore();

  const handleAction = (actionId: string) => {
    switch(actionId) {
      case "action-new-quotation":
        router.push("/dashboard/quotations/new");
        break;
      case "action-new-client":
        router.push("/dashboard/clients"); // assuming the user can open new client modal from there
        break;
      case "action-new-product":
        router.push("/dashboard/products");
        break;
      case "action-pipeline":
        router.push("/dashboard/pipeline");
        break;
      case "action-settings":
        router.push("/dashboard/settings");
        break;
    }
  };

  // Memoize the indexed data so it only rebuilds when stores change
  const allItems = useMemo(() => {
    return buildSearchIndex(quotations, clients, products, handleAction);
  }, [quotations, clients, products, router]);

  // Memoize the search engine
  const engine = useMemo(() => {
    return new SearchEngine(allItems);
  }, [allItems]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [recentItems, setRecentItems] = useState<SearchItem[]>([]);

  // Update recent items or search results depending on query
  useEffect(() => {
    if (!query.trim()) {
      // Empty state
      const recent = rankRecentItems(allItems.filter(item => item.type !== "action")).slice(0, 5);
      const actions = allItems.filter(item => item.type === "action");
      
      // Combine actions and recent items for the empty state
      setRecentItems([...actions, ...recent]);
      setResults([]);
    } else {
      // Fuzzy search
      const res = engine.search(query);
      setResults(res.slice(0, 15)); // Cap to top 15 results
      setRecentItems([]);
    }
  }, [query, engine, allItems]);

  return {
    query,
    setQuery,
    results,
    recentItems,
    isEmpty: !query.trim(),
  };
}
