# Canva Bulk Ready

A browser-local CSV preflight and three-row test-batch generator for Canva Bulk Create.

## Narrow promise

Before a large Canva Bulk Create run—or while isolating a `zero designs created` failure—check the CSV for basic data-side risks and export a three-row test batch.

The check currently covers:

- blank and duplicate headers;
- rows with inconsistent column counts;
- entirely empty columns;
- exact duplicate rows;
- malformed quoted CSV fields.

If the CSV passes but the three-row batch still fails, the result explicitly points to Canva mapping, design state, or a platform issue rather than claiming a root cause.

## Privacy

The CSV is read in the browser and is not uploaded. Anonymous measurement sends fixed event names only. It never sends filenames, headers, cell values, row details, or the receipt text. CounterAPI may still receive ordinary network metadata such as IP address and User-Agent.

## Development

```bash
npm test
npm run check
npm run serve
```

Open `http://127.0.0.1:4176`.

## Validation boundary

Runnable/Public/Observable do not mean useful. Validation requires an external Canva Bulk Create user to run a real CSV or provide a sanitized sample/header, then report a specific useful outcome or request continued help.
