# Meridian acceptance — 2026-11-23

## Versions
- Initial main: 40ff6b49f1f34f1f93d969827a64d4b641fb2eb2.
- Initial live Pages: a6eba6834f7b5a06a1c4e11eb672451ff12ba9a4 (November 15). Saved-contact UI had not been published.
- Source fix: ba8b2693c409480cfce18cc26a807b851978ddd3.
- Final Pages commit: 6f16a31db16d4ae565aea26264ffee913c529d20.
- Deployment: https://github.com/aimiaosu-blip/meridian/actions/runs/45164710802 — completed / success.
- git diff origin/gh-pages origin/main:dist returned no differences.
- Website: https://aimiaosu-blip.github.io/meridian/

## Browser acceptance
Performed in Chromium, without signing in to Meridian.

| Check | Result / evidence |
| --- | --- |
| Public access | Pass. Home, teams, planning and results accessible without login. No account system added. |
| Create contacts | Pass. Created QA Stockholm (Stockholm) and QA Tokyo (Tokyo), both 09:00–18:00. |
| Globe | Pass on Canvas fallback. Globe rendered and rotated; Stockholm and Tokyo markers observed. Hardware WebGL was unavailable in this environment. |
| Saved contacts shown | Pass. Both directly listed in Plan a meeting with aria-pressed=false initially. |
| Add / cancel | Pass. Clicking adds a chip; clicking again removes it and resets aria-pressed. Chip removal also resets selection. |
| Repeated selection | Pass. Repeated add/remove/re-add leaves one chip per contact; two contacts plus organizer produces three participants. |
| Time calculation | Pass. 2026-11-24, 45 minutes: Stockholm 09:15–10:00 = Tokyo 17:15–18:00. ArrowLeft on Tokyo slider moves all clocks to Stockholm 09:00–09:45 / Tokyo 17:00–17:45. |
| Persistence | Pass. Both contacts remain after reload. |
| Fresh meeting | Pass. Home then Plan a meeting, and reload then Plan a meeting, show contacts unselected. Editing an existing meeting correctly retains its participants. |
| Keyboard | Pass for Space selection, Escape closing, and arrow-key time adjustment. Fields have labels; selection exposes aria-pressed; removal buttons have contact names. This is a basic check, not a full WCAG audit. |
| Responsive layout | Pass at 454px and 340px CSS widths using 300% / 400% browser zoom. Form, saved contacts and results accessible by scrolling. At 340px document scrollWidth=337, dialog clientWidth=scrollWidth=305. |
| Console | Initial WebGL construction errors reproduced. After the fix and hard reload of the original URL, no new site error/warning entries observed. Browser-extension metadata errors are unrelated to site code. |

## Fixes
1. Published the saved-contact changes that were on main but absent from gh-pages (b6bcd43).
2. Bumped app entry version to v7 and globe import version to v2 to refresh changed resources.
3. Probe WebGL2 before constructing Three.js; use the existing Canvas fallback directly when unavailable. The successful context is reused by the renderer.
4. Published the complete dist tree, not just selected files.

## Automated tests
- Command: npm test (node --test tests/*.test.mjs).
- Before changes: 78 tests, 78 pass, 0 fail, 0 skipped/cancelled.
- After changes and final verification: 78 tests, 78 pass, 0 fail, 0 skipped/cancelled.
- No failing-test causes.
- Existing saved-contact tests are source-shape checks; live browser interactions above provide behavioral evidence.

## Remaining limitations
- No physical iOS/Android or touch-device test. DevTools device emulation was prohibited by the browser environment, so responsive checks used narrow CSS viewports via zoom.
- Hardware WebGL path was not exercised; Canvas fallback was exercised.
- Previously cached root HTML initially kept loading v6 even after deployment. A real browser hard refresh loaded v7 at the original URL and showed both saved contacts unselected. Returning visitors may need a hard refresh while old caches expire.
- Saved contacts remain local to the browser; they are not synchronized across devices.
- No known functional blocker remains within the tested scope.
