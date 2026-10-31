/**
 * The Field Access resource for account facts on Team Management screens.
 *
 * `platform.team` covers a person's phone and server-owned account facts.
 * Phone has separate Read and Write switches; the sign-in and invitation facts
 * can only be read. Hidden values leave the response and the form, and a phone
 * the role cannot write is never submitted. Lists decide from the viewer's
 * map; a detail view from the record.
 */
export const TEAM_FIELD_RESOURCE = "platform.team";
