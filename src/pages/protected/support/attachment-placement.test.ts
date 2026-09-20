import { describe, expect, it } from "vitest";
import type {
  TicketAttachment,
  TicketComment,
  TicketUser,
} from "@/redux/services/tickets-api";
import {
  buildTicketConversationDays,
  conversationCommentBody,
  partitionTicketAttachments,
} from "./attachment-placement";

const uploader: TicketUser = {
  id: "12",
  name: "Ada Okoye",
  email: "ada@example.com",
  tenant_kind: "PLATFORM",
  role: "Support",
};

const attachment = (id: string, created_at: string): TicketAttachment => ({
  id,
  original_filename: `${id}.pdf`,
  content_type: "application/pdf",
  size: 100,
  url: `/support/${id}`,
  uploaded_by: uploader,
  comment_id: null,
  created_at,
});

const comment = (
  id: string,
  author: TicketUser,
  created_at: string,
): TicketComment => ({
  id,
  author,
  body: `Message ${id}`,
  visibility: "PUBLIC",
  attachments: [],
  created_at,
  updated_at: created_at,
});

describe("ticket attachment placement", () => {
  it("creates a visible conversation message for a file sent without text", () => {
    expect(conversationCommentBody("", true)).toBe("Shared a file.");
    expect(conversationCommentBody("  Evidence attached  ", true))
      .toBe("Evidence attached");
    expect(conversationCommentBody("", false)).toBe("");
  });

  it("keeps only the opening upload batch in ticket files", () => {
    const result = partitionTicketAttachments([
      attachment("opening-one", "2026-09-20T08:04:00Z"),
      attachment("opening-two", "2026-09-20T08:08:00Z"),
      attachment("follow-up", "2026-09-20T09:00:00Z"),
    ], "2026-09-20T08:00:00Z");

    expect(result.initial.map((file) => file.id))
      .toEqual(["opening-one", "opening-two"]);
    expect(result.conversation.map((file) => file.id)).toEqual(["follow-up"]);
  });

  it("does not use the ticket status to place a later file", () => {
    const result = partitionTicketAttachments([
      attachment("later", "2026-09-20T10:00:00Z"),
    ], "2026-09-20T08:00:00Z");

    expect(result.initial).toEqual([]);
    expect(result.conversation[0].id).toBe("later");
  });

  it("uses one sender heading until another person replies or the date changes", () => {
    const secondUploader = { ...uploader, id: "18", name: "Tunde Adebayo" };
    const days = buildTicketConversationDays([
      comment("one", uploader, "2026-09-20T08:00:00Z"),
      comment("two", uploader, "2026-09-20T08:05:00Z"),
      comment("three", secondUploader, "2026-09-20T08:06:00Z"),
      comment("four", secondUploader, "2026-09-21T08:00:00Z"),
    ], []);

    expect(days).toHaveLength(2);
    expect(days[0].groups.map((group) => group.items.length)).toEqual([2, 1]);
    expect(days[1].groups[0].items).toHaveLength(1);
  });
});
