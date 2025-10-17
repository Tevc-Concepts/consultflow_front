import {
  forceSeed,
  getDocumentById,
  updateDocument,
  addDocumentComment,
  getReportById,
  updateReport,
  addReportComment,
  getTicketById,
  updateTicket,
  addTicketComment
} from '../localDb';

// Note: These tests exercise pure DB helpers to validate comment creation and basic update shape.
// API-level permission checks are enforced in route, so here we ensure helpers behave as expected.

describe('Comments and permissions (localDb)', () => {
  beforeAll(() => {
    forceSeed();
  });

  test('can create document comment without mutating document fields', () => {
    // Pick a known document
    const docId = getSampleDocId();
    const before = getDocumentById(docId)!;
    addDocumentComment(docId, 'consultant-1', 'Looks good');
    const after = getDocumentById(docId)!;
    expect(after.file_name).toBe(before.file_name);
    expect(new Date(after.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(before.updated_at).getTime());
  });

  test('can create report comment without mutating report fields', () => {
    const repId = getSampleReportId();
    const before = getReportById(repId)!;
    addReportComment(repId, 'client-lagos', 'Please clarify section 2.');
    const after = getReportById(repId)!;
    expect(after.title).toBe(before.title);
    expect(new Date(after.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(before.updated_at).getTime());
  });

  test('ticket comments do not change ticket subject', () => {
    const tId = getSampleTicketId();
    const tBefore = getTicketById(tId)!;
    addTicketComment(tId, 'client-lagos', 'Following up');
    const tAfter = getTicketById(tId)!;
    expect(tAfter.subject).toBe(tBefore.subject);
  });
});

function getSampleDocId(): string {
  // The seed generates documents with ids like `${company}-doc-...`.
  // For deterministic behavior pick one from Lagos company.
  const prefix = 'lagos-ng-doc-';
  // Fallback to a generic
  const candidates = ['lagos-ng-doc-0', 'lagos-ng-doc-1', 'lagos-ng-doc-2'];
  // These are prefixes; since ids include timestamp, we cannot know exact id here.
  // In a real test we'd query list. To keep this minimal, we insert a new one and use its id.
  const now = Date.now();
  const id = `${prefix}jest-${now}`;
  // Create via updateDocument is not valid; comments require existence. So we skip and instead rely on earlier seeded docs.
  // For a simple approach, return a known pattern; if not found the earlier tests would fail, indicating seed mismatch.
  // In practice, we would expose a listDocuments() helper for tests.
  // @ts-ignore
  const db = require('../localDb');
  const rows = db.query("SELECT id FROM documents LIMIT 1");
  return rows[0].id as string;
}

function getSampleReportId(): string {
  // @ts-ignore
  const db = require('../localDb');
  const rows = db.query("SELECT id FROM reports LIMIT 1");
  return rows[0].id as string;
}

function getSampleTicketId(): string {
  // @ts-ignore
  const db = require('../localDb');
  const rows = db.query("SELECT id FROM support_tickets LIMIT 1");
  return rows[0].id as string;
}
