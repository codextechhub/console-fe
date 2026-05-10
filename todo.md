## Undone

# 1. Check the former school design to know what it looks like and compare with existing one. the view-school in particular, it was changed to the new design in e970f0ee7837beec039bcdc7da757092fad118c2 commit hash
# 2. Add loading blue cursor on any page that has to do with fetching or creating a resource. Make a function that can be used universally across the whole codebase.
# 3. Deploy backend change: `activated_at` added to BranchDetailSerializer — needs to be pushed to staging/production so the branch detail API returns it.
# 4. I want the prefill create school to show also on the dev view for now until I explicit ask for its removal

## Done

# 1. Remove Admin Role field from Add Branch (branch admin section) — role is prebuilt internally, field removed from UI, interface, validation schema, and API payload.
# 2. Remove Admin Role field from Create School Admin step — same reason, removed from UI, interface, validation schema, and API payload.
# 3. Add formatEnum utility — converts raw DB enum keys (e.g. FAITH_BASED, 3_TERMS) to human-readable labels across school management pages.
# 4. Add activated_at to branch details view — shows formatted date or "Not Activated" when null.
