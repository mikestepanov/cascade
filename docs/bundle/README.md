# Bundle Size Optimization

Track and optimize Nixelo's bundle size over time.

## Contents

- [GUIDE.md](./GUIDE.md) - Optimization techniques and strategies
- `RESULTS_YYYY-MM-DD.md` - Historical measurements

## Results History

| Date | Total Size | Notes |
|------|------------|-------|
| 2025-11-23 | See [results](./RESULTS_2025-11-23.md) | Initial optimization |

## Adding New Results

After running bundle analysis, create a new file:

```bash
# Run analysis
pnpm run build
pnpm run analyze  # if available

# Create results file
# docs/bundle/RESULTS_YYYY-MM-DD.md
```

Include:
- Total bundle size (gzipped)
- Largest chunks
- Notable changes from previous
- What caused the change (new dep, refactor, etc.)

---

*Last Updated: 2025-11-27*
