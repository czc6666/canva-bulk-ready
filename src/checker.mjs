function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('Unclosed quoted field');
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function checkBulkCsv(text) {
  const normalized = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = parseCsv(normalized).filter((row) => row.some((value) => value.trim() !== ''));
  if (rows.length === 0) throw new Error('CSV is empty');

  const header = rows[0];
  const data = rows.slice(1);
  const findings = [];
  const normalizedHeaders = header.map((value) => value.trim().toLocaleLowerCase());

  header.forEach((value, index) => {
    if (!value.trim()) findings.push({ severity: 'error', code: 'blank_header', row: 1, column: index + 1 });
  });

  const duplicateHeaders = new Set();
  normalizedHeaders.forEach((value, index) => {
    if (value && normalizedHeaders.indexOf(value) !== index) duplicateHeaders.add(value);
  });
  if (duplicateHeaders.size) findings.push({ severity: 'error', code: 'duplicate_header', count: duplicateHeaders.size });

  data.forEach((row, index) => {
    if (row.length !== header.length) {
      findings.push({ severity: 'error', code: 'uneven_columns', row: index + 2, expected: header.length, actual: row.length });
    }
  });

  const emptyColumns = header
    .map((_, column) => data.every((row) => !(row[column] ?? '').trim()))
    .filter(Boolean).length;
  if (emptyColumns) findings.push({ severity: 'warning', code: 'empty_columns', count: emptyColumns });

  const duplicateRows = data.length - new Set(data.map((row) => JSON.stringify(row))).size;
  if (duplicateRows) findings.push({ severity: 'warning', code: 'duplicate_rows', count: duplicateRows });

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  const warningCount = findings.filter((finding) => finding.severity === 'warning').length;
  const verdict = errorCount ? 'data_risk' : warningCount ? 'review' : 'ready';
  const testBatchCsv = renderCsv([header, ...data.slice(0, 3)]);
  const receipt = [
    'Canva Bulk Create Checkup',
    `Verdict: ${verdict}`,
    `Columns: ${header.length}`,
    `Data rows: ${data.length}`,
    `Errors: ${errorCount}`,
    `Warnings: ${warningCount}`,
    ...findings.map((finding) => `${finding.severity.toUpperCase()}: ${finding.code}${finding.row ? ` at row ${finding.row}` : ''}`),
    errorCount
      ? 'Next step: fix the data-side errors, export again, then test with the three-row batch.'
      : [
          'Next step: test the three-row batch in the same current design.',
          'Before Generate, confirm the side panel connected field count is complete, at least one row is selected, and each field is mapped to the intended element.',
          'If that tiny batch still fails, focus on Canva mapping, design state, or a platform issue rather than basic CSV structure.',
        ].join(' '),
  ].join('\n');

  return {
    verdict,
    findings,
    summary: { columns: header.length, dataRows: data.length, errorCount, warningCount },
    testBatchCsv,
    receipt,
  };
}
