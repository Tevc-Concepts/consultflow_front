// Mock next/server to avoid relying on Web Request in Jest
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

import { GET, POST } from '../route';
import { forceSeed, getDocuments, getReports, getTickets } from '@shared/api/localDb';

function makeGet(url: string) { return { url: new URL(url, 'http://localhost').toString() } as any; }
function makePost(body: any) { return { json: async () => body } as any; }

describe('Local Clients Route - permissions & comments', () => {
  beforeAll(() => {
    // Re-seed database for deterministic data
    forceSeed();
  });

  it('denies non-owner document updates with 403, allows owner updates', async () => {
    // Pick a company with data
    const docs = getDocuments('lagos-ng');
    expect(docs.length).toBeGreaterThan(0);
    const doc = docs[0];

    // Owner is the client for company lagos-ng per seed: client-lagos
    const ownerId = doc.uploaded_by; // should be client-lagos
    const nonOwnerId = 'consultant-1';

    // Non-owner attempt
    const nonOwnerReq = makePost({ action: 'updateDocument', documentId: doc.id, patch: { description: 'hijack' }, userId: nonOwnerId });
    const nonOwnerRes = await POST(nonOwnerReq as any);
    expect(nonOwnerRes.status).toBe(403);

    // Owner attempt should pass
    const ownerReq = makePost({ action: 'updateDocument', documentId: doc.id, patch: { description: 'legit' }, userId: ownerId });
    const ownerRes = await POST(ownerReq as any);
    expect(ownerRes.status).toBe(200);
    const json = await ownerRes.json();
    expect(json.document.description).toBe('legit');
  });

  it('denies non-creator report updates with 403, allows creator updates', async () => {
    const reports = getReports('lagos-ng');
    expect(reports.length).toBeGreaterThan(0);
    const report = reports[0];
    const ownerId = report.created_by; // consultant for that company
    const nonOwnerId = 'client-lagos';

    const nonOwnerReq = makePost({ action: 'updateReport', reportId: report.id, patch: { title: 'nope' }, userId: nonOwnerId });
    const nonOwnerRes = await POST(nonOwnerReq as any);
    expect(nonOwnerRes.status).toBe(403);

    const ownerReq = makePost({ action: 'updateReport', reportId: report.id, patch: { title: 'ok' }, userId: ownerId });
    const ownerRes = await POST(ownerReq as any);
    expect(ownerRes.status).toBe(200);
    const json = await ownerRes.json();
    expect(json.report.title).toBe('ok');
  });

  it('denies non-creator ticket updates with 403, allows creator updates', async () => {
    const tickets = getTickets('lagos-ng');
    expect(tickets.length).toBeGreaterThan(0);
    const ticket = tickets[0];
    const ownerId = ticket.created_by; // client for the company
    const nonOwnerId = 'consultant-1';

    const nonOwnerReq = makePost({ action: 'updateTicket', ticketId: ticket.id, patch: { subject: 'try' }, userId: nonOwnerId });
    const nonOwnerRes = await POST(nonOwnerReq as any);
    expect(nonOwnerRes.status).toBe(403);

    const ownerReq = makePost({ action: 'updateTicket', ticketId: ticket.id, patch: { subject: 'ok' }, userId: ownerId });
    const ownerRes = await POST(ownerReq as any);
    expect(ownerRes.status).toBe(200);
    const json = await ownerRes.json();
    expect(json.ticket.subject).toBe('ok');
  });

  it('allows adding comments to docs, reports, and tickets and returns author_name in GET thread', async () => {
    const docs = getDocuments('lagos-ng');
    const reports = getReports('lagos-ng');
    const tickets = getTickets('lagos-ng');
    const doc = docs[0];
    const report = reports[0];
    const ticket = tickets[0];

    // Use consultant-1 as commenter
    const commenter = 'consultant-1';

    // Add comments
    const docCommentRes = await POST(makePost({ action: 'addDocumentComment', documentId: doc.id, authorId: commenter, message: 'doc cmt' }) as any);
    expect(docCommentRes.status).toBe(200);

    const reportCommentRes = await POST(makePost({ action: 'addReportComment', reportId: report.id, authorId: commenter, message: 'rep cmt' }) as any);
    expect(reportCommentRes.status).toBe(200);

    const ticketCommentRes = await POST(makePost({ action: 'addTicketComment', ticketId: ticket.id, authorId: commenter, message: 'tic cmt' }) as any);
    expect(ticketCommentRes.status).toBe(200);

    // Fetch threads via GET and expect author_name populated
    const docThread = await GET(makeGet(`/api/local/clients?action=documentComments&documentId=${encodeURIComponent(doc.id)}`) as any);
    expect(docThread.status).toBe(200);
    const docJson = await docThread.json();
    expect(Array.isArray(docJson.comments)).toBe(true);
    expect(docJson.comments.some((c: any) => c.author_name)).toBe(true);

    const repThread = await GET(makeGet(`/api/local/clients?action=reportComments&reportId=${encodeURIComponent(report.id)}`) as any);
    expect(repThread.status).toBe(200);
    const repJson = await repThread.json();
    expect(repJson.comments.some((c: any) => c.author_name)).toBe(true);

    const ticThread = await GET(makeGet(`/api/local/clients?action=ticketComments&ticketId=${encodeURIComponent(ticket.id)}`) as any);
    expect(ticThread.status).toBe(200);
    const ticJson = await ticThread.json();
    expect(ticJson.comments.some((c: any) => c.author_name)).toBe(true);
  });
});
