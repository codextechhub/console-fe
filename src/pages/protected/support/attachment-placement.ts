import type {
  TicketAttachment,
  TicketComment,
  TicketUser,
} from "@/redux/services/tickets-api";

const OPENING_UPLOAD_GAP_MS = 5 * 60 * 1000;

const timestamp = (value: string): number => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export type TicketConversationItem =
  | {
      id: string;
      kind: "comment";
      author: TicketUser;
      createdAt: string;
      comment: TicketComment;
    }
  | {
      id: string;
      kind: "attachment";
      author: TicketUser;
      createdAt: string;
      attachment: TicketAttachment;
    };

export interface TicketConversationDay {
  key: string;
  date: Date;
  groups: Array<{
    author: TicketUser;
    items: TicketConversationItem[];
  }>;
}

const dayKey = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const sameAuthor = (left: TicketUser, right: TicketUser): boolean =>
  left.id === right.id || (
    !left.id
    && !right.id
    && left.email.toLowerCase() === right.email.toLowerCase()
  );

/**
 * Gives every sent file a conversation record, even when it has no typed text.
 *
 * The upload endpoint accepts an optional comment id. Supplying a small visible
 * message makes the file part of the timeline and preserves note visibility.
 */
export function conversationCommentBody(
  body: string,
  hasAttachment: boolean,
): string {
  return body.trim() || (hasAttachment ? "Shared a file." : "");
}

/**
 * Builds a dated timeline with one sender heading per uninterrupted run.
 *
 * Another sender or a new calendar day starts a fresh group. Attachments use
 * the same sequence so historical unbound uploads still show who sent them.
 */
export function buildTicketConversationDays(
  comments: TicketComment[],
  attachments: TicketAttachment[],
): TicketConversationDay[] {
  const items: TicketConversationItem[] = [
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      kind: "comment" as const,
      author: comment.author,
      createdAt: comment.created_at,
      comment,
    })),
    ...attachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      kind: "attachment" as const,
      author: attachment.uploaded_by,
      createdAt: attachment.created_at,
      attachment,
    })),
  ].sort((left, right) => timestamp(left.createdAt) - timestamp(right.createdAt));

  const days: TicketConversationDay[] = [];
  for (const item of items) {
    const key = dayKey(item.createdAt);
    let day = days.at(-1);
    if (!day || day.key !== key) {
      day = { key, date: new Date(item.createdAt), groups: [] };
      days.push(day);
    }

    let group = day.groups.at(-1);
    if (!group || !sameAuthor(group.author, item.author)) {
      group = { author: item.author, items: [] };
      day.groups.push(group);
    }
    group.items.push(item);
  }

  return days;
}

/**
 * Separates opening evidence from files sent later in the conversation.
 *
 * Conversation uploads are normally bound to a comment. Older clients could
 * leave them unbound, so the opening batch stays contiguous while every file
 * arrives within five minutes of the ticket or the previous opening file.
 */
export function partitionTicketAttachments(
  attachments: TicketAttachment[],
  ticketCreatedAt: string,
): { initial: TicketAttachment[]; conversation: TicketAttachment[] } {
  const ordered = [...attachments].sort(
    (left, right) => timestamp(left.created_at) - timestamp(right.created_at),
  );
  let openingBatchEndsAt = timestamp(ticketCreatedAt) + OPENING_UPLOAD_GAP_MS;
  let openingBatchComplete = false;
  const initial: TicketAttachment[] = [];
  const conversation: TicketAttachment[] = [];

  for (const attachment of ordered) {
    const attachedAt = timestamp(attachment.created_at);
    if (!openingBatchComplete && attachedAt <= openingBatchEndsAt) {
      initial.push(attachment);
      openingBatchEndsAt = attachedAt + OPENING_UPLOAD_GAP_MS;
    } else {
      openingBatchComplete = true;
      conversation.push(attachment);
    }
  }

  return { initial, conversation };
}
