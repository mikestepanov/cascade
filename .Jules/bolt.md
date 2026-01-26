# Bolt's Journal

This journal records critical performance learnings.

## 2024-05-24 - Unmemoized Props in InfiniteCardList Wrappers
**Learning:** Components wrapping `InfiniteCardList` (like `DocumentTemplatesList`) often create `variables` objects and `renderItem` functions inline. This causes `InfiniteCardList` (and its children like `CardList`) to re-render unnecessarily on every parent render, even if data hasn't changed.
**Action:** Always wrap `variables` in `useMemo` and `renderItem` in `useCallback` when passing them to `InfiniteCardList` or similar generic list components.
