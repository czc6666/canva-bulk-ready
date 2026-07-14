import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBulkCsv } from '../src/checker.mjs';

test('a clean bulk-create CSV produces a ready verdict and three-row test batch', () => {
  const csv = [
    'Headline,Caption,Image URL',
    'Spring sale,Save 20%,https://example.com/a.jpg',
    'Summer sale,Save 30%,https://example.com/b.jpg',
    'Autumn sale,Save 10%,https://example.com/c.jpg',
    'Winter sale,Save 25%,https://example.com/d.jpg',
  ].join('\n');

  const result = checkBulkCsv(csv);

  assert.equal(result.verdict, 'ready');
  assert.equal(result.summary.errorCount, 0);
  assert.equal(result.summary.dataRows, 4);
  assert.equal(result.summary.columns, 3);
  assert.equal(result.testBatchCsv.split('\n').length, 4);
  assert.ok(!result.receipt.includes('Spring sale'));
  assert.ok(!result.receipt.includes('Headline'));
});

test('blank or duplicate headers and uneven rows produce data-side errors', () => {
  const csv = [
    'Headline,headline,',
    'First,Caption only',
    'Second,Caption,Extra,Unexpected',
  ].join('\n');

  const result = checkBulkCsv(csv);
  const codes = result.findings.map((finding) => finding.code);

  assert.equal(result.verdict, 'data_risk');
  assert.ok(codes.includes('blank_header'));
  assert.ok(codes.includes('duplicate_header'));
  assert.ok(codes.includes('uneven_columns'));
  assert.ok(!result.receipt.includes('First'));
  assert.ok(!result.receipt.includes('Headline'));
});

test('blank columns and repeated rows produce a review verdict instead of a false error', () => {
  const csv = [
    'Headline,Caption,Optional',
    'One,Text,',
    'One,Text,',
  ].join('\n');

  const result = checkBulkCsv(csv);
  const codes = result.findings.map((finding) => finding.code);

  assert.equal(result.verdict, 'review');
  assert.equal(result.summary.errorCount, 0);
  assert.ok(codes.includes('empty_columns'));
  assert.ok(codes.includes('duplicate_rows'));
});

test('quoted commas, quotes, and line breaks stay valid in the three-row test batch', () => {
  const csv = 'Headline,Caption\n"Sale, today","She said ""go"""\nSecond,"two\nlines"';

  const result = checkBulkCsv(csv);
  const roundTrip = checkBulkCsv(result.testBatchCsv);

  assert.equal(result.verdict, 'ready');
  assert.equal(result.summary.dataRows, 2);
  assert.equal(roundTrip.summary.dataRows, 2);
  assert.equal(roundTrip.summary.columns, 2);
});

test('an unclosed quoted field is rejected', () => {
  assert.throws(() => checkBulkCsv('Headline,Caption\n"broken,caption'), /Unclosed quoted field/);
});

test('the no-content receipt gives Canva-side mapping checks after a structurally ready CSV', () => {
  const result = checkBulkCsv('Monday,Tuesday\nJuly 1,July 2\nJuly 8,July 9');

  assert.equal(result.verdict, 'ready');
  assert.match(result.receipt, /connected field count/i);
  assert.match(result.receipt, /at least one row is selected/i);
  assert.match(result.receipt, /same current design/i);
  assert.ok(!result.receipt.includes('Monday'));
  assert.ok(!result.receipt.includes('July 1'));
});
