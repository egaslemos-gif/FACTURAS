import Fuse from "fuse.js";
import { SearchItem } from "./searchIndex";

export const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "subtitle", weight: 0.3 },
    { name: "searchTokens", weight: 0.2 }
  ],
  threshold: 0.3, // 0.0 requires perfect match, 1.0 matches anything. 0.3 is a good balance for fuzzy
  ignoreLocation: true,
  includeScore: true,
};

export class SearchEngine {
  private fuse: Fuse<SearchItem>;

  constructor(items: SearchItem[]) {
    this.fuse = new Fuse(items, FUSE_OPTIONS);
  }

  public updateIndex(items: SearchItem[]) {
    this.fuse.setCollection(items);
  }

  public search(query: string): SearchItem[] {
    if (!query.trim()) return [];
    const results = this.fuse.search(query);
    // Return items sorted by fuse score (lower is better)
    return results.map(result => result.item);
  }
}
