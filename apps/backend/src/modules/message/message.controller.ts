import type { RequestHandler } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { ApplicationRepository } from '../application/application.repository.js';
import { JobRepository } from '../job/job.repository.js';
import { UserRole } from '../user/user.entity.js';
import { UserRepository } from '../user/user.repository.js';
import { publishTo, signChatTicket, TICKET_TTL_SECONDS, WS_PATH } from './message.gateway.js';
import {
  addChatMessage,
  chatThreadsFor,
  chatUnread,
  findThread,
  findThreadByApplication,
  markChatRead,
  openChatThread,
  type StoredThread,
} from './chat.store.js';

/**
 * Recruiter ⇄ candidate chat.
 *
 * The rules every handler here keeps:
 *   1. a thread belongs to exactly one application, and only its recruiter
 *      (the job owner) and its candidate can read or write it;
 *   2. a candidate cannot start a conversation — `openThread` is a recruiter
 *      action, and `postMessage` refuses a candidate's first message;
 *   3. responses are built per viewer, so "me"/"them" and the counterpart's
 *      name are decided on the server, never guessed in the browser.
 *
 * Writes come over HTTP (cookies + CSRF + validation); the WebSocket only
 * pushes the updated thread to the two parties.
 *
 * DEMO PHASE — the conversations live in memory (chat.store.ts), not in the
 * database. A browser reload, a logout or a new login keeps them; restarting
 * the backend empties them. Swapping back to the table-backed repository is a
 * one-line change in each handler.
 */

const users = new UserRepository();
const jobs = new JobRepository();
const applications = new ApplicationRepository();
type Viewer = { userId: string; role: UserRole };
const isAdmin = (viewer: Viewer) =>
  viewer.role === UserRole.ADMIN || viewer.role === UserRole.SUPERADMIN;

type ChatMessagePayload = { id: string; from: 'me' | 'them'; text: string; at: string };

type ChatThreadPayload = {
  id: string;
  applicationId: string;
  jobTitle: string;
  lastMessageAt: string | null;
  name: string;
  role: string;
  unread: number;
  messages: ChatMessagePayload[];
};

/** One thread, shaped for one viewer. */
async function toChatThread(thread: StoredThread, viewerId: string, unread: number): Promise<ChatThreadPayload> {
  const application = await applications.findById(thread.applicationId);
  const [job, counterpart] = await Promise.all([
    application ? jobs.findById(application.jobId) : Promise.resolve(null),
    users.findById(thread.candidateId === viewerId ? thread.recruiterId : thread.candidateId),
  ]);
  /* Both parties are still resolved from the database: the chat itself is
     in-memory, the candidate/recruiter identities are real rows. */
  const rows = thread.messages;

  const jobTitle = job?.title ?? 'the role';
  const viewerIsCandidate = thread.candidateId === viewerId;

  return {
    id: thread.threadId,
    applicationId: thread.applicationId,
    jobTitle,
    lastMessageAt: thread.lastMessageAt ? thread.lastMessageAt.toISOString() : null,
    /* The other side of the table: recruiters read the candidate, candidates
       read who is hiring (a name, else the company). */
    name:
      counterpart?.name?.trim() ||
      counterpart?.companyName?.trim() ||
      (viewerIsCandidate ? 'Recruiter' : 'Candidate'),
    role: jobTitle,
    unread,
    messages: rows.map((row) => ({
      id: row.messageId,
      from: row.senderId === viewerId ? ('me' as const) : ('them' as const),
      text: row.body,
      at: row.createdAt.toISOString(),
    })),
  };
}

const unreadOf = (thread: StoredThread, viewerId: string) => chatUnread(thread, viewerId);

/** Both parties' sockets get their own projection of the thread. */
async function pushThread(thread: StoredThread) {
  const [candidateView, recruiterView] = await Promise.all([
    toChatThread(thread, thread.candidateId, await unreadOf(thread, thread.candidateId)),
    toChatThread(thread, thread.recruiterId, await unreadOf(thread, thread.recruiterId)),
  ]);
  publishTo([thread.candidateId], { type: 'thread', thread: candidateView });
  publishTo([thread.recruiterId], { type: 'thread', thread: recruiterView });
}

/** Proves the viewer is one of the two parties; returns the thread. */
async function threadForViewer(threadId: string, viewerId: string) {
  const thread = findThread(threadId);
  if (!thread) throw new AppError(404, 'Conversation not found');
  if (thread.candidateId !== viewerId && thread.recruiterId !== viewerId) {
    throw new AppError(403, 'This conversation belongs to someone else');
  }
  return thread;
}

/** GET /api/messages/threads — my conversations, newest activity first. */
export const listThreads: RequestHandler = async (req, res, next) => {
  try {
    const viewerId = req.user!.userId;
    const side = req.user!.role === UserRole.CANDIDATE ? 'candidate' : 'recruiter';
    const rows = chatThreadsFor(viewerId, side);

    /* A candidate only sees a conversation the recruiter has written in: the
       empty thread a recruiter opened is invisible until its first message. */
    const visible = side === 'candidate' ? rows.filter((thread) => thread.lastMessageAt) : rows;

    const threads = await Promise.all(
      visible.map((thread) => toChatThread(thread, viewerId, chatUnread(thread, viewerId))),
    );

    res.json({
      success: true,
      data: { threads, unread: threads.reduce((sum, thread) => sum + thread.unread, 0) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/messages/threads — the recruiter opens the conversation while
 * reading an applicant. Re-opening returns the same thread, never a copy.
 */
export const openThread: RequestHandler = async (req, res, next) => {
  try {
    const viewer = { userId: req.user!.userId, role: req.user!.role };
    const application = await applications.findById(req.body.applicationId as string);
    if (!application) throw new AppError(404, 'Applicant not found');

    const job = await jobs.findById(application.jobId);
    if (!job || job.isDeleted) throw new AppError(404, 'Applicant not found');
    if (!isAdmin(viewer) && job.postedBy !== viewer.userId) {
      throw new AppError(403, 'This applicant belongs to another recruiter’s job');
    }

    const thread = openChatThread({
      applicationId: application.applicationId,
      candidateId: application.candidateId,
      /* The thread belongs to the job's owner — an admin acts for them. */
      recruiterId: job.postedBy ?? viewer.userId,
    });

    res.json({
      success: true,
      data: { thread: await toChatThread(thread, viewer.userId, unreadOf(thread, viewer.userId)) },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/messages/threads/:id — send a message. */
export const postMessage: RequestHandler = async (req, res, next) => {
  try {
    const viewerId = req.user!.userId;
    const thread = await threadForViewer(req.params.id as string, viewerId);

    /* The recruiter starts the conversation; a candidate can only answer one
       that already exists. Enforced here, not just where the UI shows up. */
    if (thread.candidateId === viewerId && !thread.lastMessageAt) {
      throw new AppError(403, 'Wait for the recruiter to message you first');
    }

    addChatMessage({
      threadId: thread.threadId,
      senderId: viewerId,
      senderRole: req.user!.role,
      body: req.body.body as string,
    });
    /* `thread` is mutated in place by the store (message appended, timestamp
       moved) — the same object is already the freshest copy. */
    await pushThread(thread);

    res.status(201).json({
      success: true,
      data: { thread: await toChatThread(thread, viewerId, unreadOf(thread, viewerId)) },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/messages/threads/:id/read — opening a thread clears its badge. */
export const markThreadRead: RequestHandler = async (req, res, next) => {
  try {
    const viewerId = req.user!.userId;
    const thread = await threadForViewer(req.params.id as string, viewerId);
    markChatRead(thread, viewerId);
    res.json({
      success: true,
      data: { thread: await toChatThread(thread, viewerId, unreadOf(thread, viewerId)) },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/messages/ws-ticket — a 60-second pass for the push socket. */
export const issueWsTicket: RequestHandler = (req, res) => {
  res.json({
    success: true,
    data: { ticket: signChatTicket(req.user!), path: WS_PATH, expiresIn: TICKET_TTL_SECONDS },
  });
};
