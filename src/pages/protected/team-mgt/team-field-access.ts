/**
 * The Field Access resource for account facts on Team Management screens.
 *
 * `platform.team` covers when a person last signed in, when their password last
 * changed, who invited them (`invited_by_id`, `invited_by_name`), and their
 * invitation's email status and expiry. The server records all of them, so a
 * switch only ever decides who reads them: a field the viewer may not read is
 * absent from the response, and its column, cell, filter or detail row is not
 * drawn. Lists decide from the viewer's map; a detail view from the record.
 */
export const TEAM_FIELD_RESOURCE = "platform.team";
