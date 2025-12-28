# Convex Architectural Review & TODOs

This document outlines remaining architectural improvements for the Convex backend.

---

## 🚨 Critical Priority (Performance & Scalability)

### Safety: Transition to Soft Deletes

**Current State**: Hard deletes permanently remove data - no recovery possible  
**Risk**: Accidental deletion = catastrophic data loss  
**Timeline**: 2-3 days  
**Status**: ⚠️ Analyzed, ready to implement

**📄 Full Implementation Guide**: See `SOFT_DELETES_TODO.md` for complete details

**Quick Summary:**
- Add `isDeleted`, `deletedAt`, `deletedBy` to 6 tables
- Update 120+ queries to filter deleted items
- 30-day retention window + auto-cleanup
- 7-phase implementation plan provided
- Backward compatible approach

---

## 🛠 Medium Priority (Maintainability & Robustness)

### Robust Cascading Deletes

**Current State**: Manual cascade logic - easy to forget updates  
**Risk**: Orphaned data when new relationships added  
**Timeline**: 1-2 hours  
**Status**: ⚠️ Analyzed, ready to implement

**📄 Full Implementation Guide**: See `CASCADE_DELETES_TODO.md` for complete details

**Quick Summary:**
- Create relationship registry (single source of truth)
- Automatic cascading - impossible to forget
- Multi-level support (parent → child → grandchild)
- Works with both hard and soft deletes
- 3 strategies: cascade, set_null, restrict