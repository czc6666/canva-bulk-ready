# Second-scene research — same channel, no outreach yet

## Candidate A: Bulk Create Not Working

- URL: https://www.reddit.com/r/canva/comments/1rpsex2/bulk_create_not_working/
- Author: `u/BehindTheMindIAm`
- Paid effort: cleared cache/browser data, tried another browser, exported the design as an image, made a copy, and tried suggestions from replies.
- Outcome already known: the author later reported it worked after waiting. This is likely a temporary Canva-side outage/state issue, so the current product would add little value now.
- Decision: reject as an outreach target.

## Candidate B: How to make this easier?

- URL: https://www.reddit.com/r/canva/comments/1uv7z71/how_to_make_this_easier/
- Author: `u/Lil-Fonzy`
- Trigger: manually moving images and descriptions from a PDF into a Canva catalog with 100+ pages.
- Paid effort: copy/paste, image cropping, and manual layout across 100+ pages.
- Mismatch: the current product checks CSV structure and isolates Bulk Create failures; this user has not yet extracted PDF content into structured rows. The bottleneck is upstream PDF-to-table/image extraction, not CSV readiness.
- Decision: reject to avoid product drift and an irrelevant promotion.

## Candidate C: Batch creating Pinterest pins

- URL: https://www.reddit.com/r/canva/comments/1se5cjz/batch_creating_pinterest_pins_in_canva_faster/
- Trigger: 6–8 pin variations per product, 10–12 products per month, approximately eight hours/month.
- Mismatch: user explicitly needs layout variation; the product only verifies structured data for Bulk Create and cannot solve variation quality.
- Decision: reject.

## Current conclusion

The first `zero designs created` thread remains the only high-fit public Reddit scene found in this pass. No second outreach was made. This avoids spam and prevents stretching the tool into PDF extraction, layout generation, or platform-outage diagnosis.
