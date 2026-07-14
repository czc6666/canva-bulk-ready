import { checkBulkCsv } from './checker.mjs';
import { createTelemetry } from './telemetry.mjs';

const telemetry = createTelemetry();
const input = document.querySelector('#csv-file');
const dropZone = document.querySelector('#drop-zone');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const verdict = document.querySelector('#verdict');
const summary = document.querySelector('#summary');
const findings = document.querySelector('#findings');
const nextStep = document.querySelector('#next-step');
const sampleButton = document.querySelector('#load-sample');
const batchButton = document.querySelector('#download-batch');
const copyButton = document.querySelector('#copy-receipt');
const feedback = document.querySelector('#feedback-link');
let latest = null;

telemetry.track('page_view');

function labelFor(code) {
  return {
    blank_header: 'Blank column header',
    duplicate_header: 'Duplicate column header',
    uneven_columns: 'Row has a different number of columns',
    empty_columns: 'A column is empty in every data row',
    duplicate_rows: 'Exact duplicate data rows',
  }[code] ?? code;
}

function showResult(checked) {
  latest = checked;
  result.hidden = false;
  const labels = {
    ready: ['READY FOR A 3-ROW TEST', 'good'],
    review: ['REVIEW BEFORE TESTING', 'warn'],
    data_risk: ['FIX DATA-SIDE RISKS FIRST', 'bad'],
  };
  verdict.textContent = labels[checked.verdict][0];
  verdict.className = `verdict ${labels[checked.verdict][1]}`;
  summary.textContent = `${checked.summary.columns} columns · ${checked.summary.dataRows} data rows · ${checked.summary.errorCount} errors · ${checked.summary.warningCount} warnings`;
  findings.replaceChildren();
  if (checked.findings.length === 0) {
    const li = document.createElement('li');
    li.className = 'finding pass';
    li.textContent = 'No basic CSV-structure issue found.';
    findings.append(li);
  } else {
    checked.findings.forEach((item) => {
      const li = document.createElement('li');
      li.className = `finding ${item.severity}`;
      li.textContent = `${labelFor(item.code)}${item.row ? ` — row ${item.row}` : ''}${item.count ? ` — ${item.count}` : ''}`;
      findings.append(li);
    });
  }
  nextStep.textContent = checked.verdict === 'data_risk'
    ? 'Fix these data-side issues, export again, then test with the three-row batch.'
    : 'Download the three-row batch and run it in the same Canva design. If that still fails, focus on field mapping, design state, batch limits, or a Canva platform issue—not basic CSV structure.';
  status.textContent = 'Check complete. Your cell values stayed in this browser.';
  telemetry.track('check_succeeded');
}

function runText(text) {
  try {
    showResult(checkBulkCsv(text));
  } catch (error) {
    latest = null;
    result.hidden = true;
    status.textContent = `Could not check this file: ${error.message}`;
    telemetry.track('check_failed');
  }
}

async function runFile(file) {
  if (!file) return;
  telemetry.track('file_selected');
  if (file.size > 10 * 1024 * 1024) {
    status.textContent = 'This validation build accepts CSV files up to 10 MB.';
    telemetry.track('check_failed');
    return;
  }
  status.textContent = 'Checking locally…';
  runText(await file.text());
}

input.addEventListener('change', () => runFile(input.files[0]));
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  runFile(event.dataTransfer.files[0]);
});

sampleButton.addEventListener('click', async () => {
  const response = await fetch('./sample/clean-bulk-create.csv');
  runText(await response.text());
  telemetry.track('sample_loaded');
});

batchButton.addEventListener('click', () => {
  if (!latest) return;
  const blob = new Blob([latest.testBatchCsv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'canva-bulk-create-3-row-test.csv';
  anchor.click();
  URL.revokeObjectURL(url);
  telemetry.track('test_batch_downloaded');
});

copyButton.addEventListener('click', async () => {
  if (!latest) return;
  try {
    await navigator.clipboard.writeText(latest.receipt);
    copyButton.textContent = 'Copied';
    telemetry.track('receipt_copied');
  } catch {
    const blob = new Blob([latest.receipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'canva-bulk-create-checkup.txt';
    anchor.click();
    URL.revokeObjectURL(url);
    copyButton.textContent = 'Downloaded receipt';
    telemetry.track('receipt_copied');
  }
});

feedback.addEventListener('click', () => telemetry.track('feedback_clicked'));
