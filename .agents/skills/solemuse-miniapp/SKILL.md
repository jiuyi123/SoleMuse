---
name: solemuse-miniapp
description: Implement or review SoleMuse's native JavaScript WeChat Mini Program frontend. Use for pages, components, state, API services, mocks, tests, and frontend architecture under apps/wechat-miniapp; do not use for the future Node.js API or Web client.
---

# SoleMuse Mini Program

Build the SoleMuse phase-one client as a native JavaScript WeChat Mini Program while keeping it replaceable against the future shared Node.js API.

## Establish scope

Before changing the client, read:

- `docs/AI 鞋履创意 Prompt 平台_PRD_V1.0.md` for product scope.
- `docs/architecture/project-structure.md` for ownership, dependency direction, and naming.

Implement only the requested slice. Do not add phase-two features, a Web client, an admin portal, online AI generation, direct messaging, trading, or backend implementation unless the user explicitly requests them.

## Preserve the client boundary

- Use native WeChat Mini Program JavaScript, WXML, WXSS, and JSON. Do not introduce a cross-platform framework or TypeScript without an explicit project decision.
- Route all network access through `core/http` and domain services. Pages and components must not call `wx.request` directly.
- Keep DTO conversion in `models`; pages consume stable page-facing models rather than transport-specific field shapes.
- Place mock responses in `apps/wechat-miniapp/mocks`, aligned with the same service contracts used by real requests. Do not embed mock datasets in pages.
- Wrap storage, upload, login, navigation, and other consequential `wx.*` calls where shared error handling or test substitution is needed.
- Never place AppSecret, server signing keys, OSS secrets, production tokens, or other server credentials in client code or repository config.

## Keep responsibilities local

- A page coordinates loading, display state, and user events for one route.
- Put single-page components inside that page's `components/`; promote a component only after it is reused or represents a stable domain concept.
- Put reusable visual primitives in `components/common` and stable product concepts such as artwork cards or AI source tags in `components/domain`.
- Keep pure, domain-free helpers in `utils`. Put authentication, artwork, ranking, interaction, and notification rules in their relevant domain layer.
- Add global state only for data that must remain coherent across pages, such as session or unread-message state. Prefer page state for everything else.

## Handle user-visible states

For data-backed pages and mutations, cover the states relevant to the change: initial loading, refresh/loading-more, empty result, success, recoverable failure, expired login, and unavailable or off-shelf content. Prevent duplicate submissions for publish, comment, like, favorite, and upload actions.

Guest browsing remains available for public works, search, and ranking. When a protected action is triggered, preserve enough route or action context to continue sensibly after login.

## Protect contract semantics

- Treat artwork status, AI source type, message type, sort mode, and pagination fields as explicit enums or constants.
- Keep like and favorite operations idempotent from the user's perspective and reconcile optimistic UI with a failed response.
- Preserve image order and distinguish the cover image from detail images.
- Update the relevant API documentation or contract whenever a request, response, error code, or field meaning changes.

## Build reliable responsive controls

- For a full-width input with a trailing text action, prefer an explicit two-column grid such as `minmax(0, 1fr) auto` (or a fixed action column when the design requires it). Avoid combining a growing flex item with auto margins; WeChat rendering can leave unintended free space between the input and action.
- Treat native `<button>` sizing as a compatibility risk in pixel-sensitive navigation, chips, and icon controls. When native button semantics are not required, use a `<view>` with `bindtap`, `aria-role="button"`, and `aria-label`, then define its dimensions explicitly. Otherwise reset width, margin, padding, line height, and `::after` styles locally.
- Keep an input's clear control inside a `position: relative` field. Position the clear control absolutely with `top: 50%`, a fixed right inset, and `translateY(-50%)`; reserve at least the control width plus both insets as input right padding so text never overlaps it.
- For content-sized history chips, use non-native clickable views with `inline-flex`, no flex growth, and a wrapping parent aligned with `justify-content: flex-start`. Verify the first item starts at the left gutter on a real WeChat viewport.
- Separate discovery and result states in markup. After search submission, hide history and hot-search sections rather than leaving empty layout space; place filters, sorting, and the result grid directly below the search row.
- Reuse the home artwork grid rules for search results unless the design says otherwise: two mobile columns, then add columns at the same tablet and desktop breakpoints. For filter rows that cannot fit safely, preserve button width and use horizontal scrolling instead of shrinking labels.
- Static CSS checks are useful but do not prove native control sizing. For header/search changes, verify at least one narrow phone and one standard phone in WeChat Developer Tools, including empty input, populated input with clear control, wrapped history, and submitted-result states.

## Verify proportionally

Run the configured lint and focused tests for changed logic. For routing, component registration, permissions, uploads, or native APIs, also identify the scenario that must be checked in WeChat Developer Tools. If the tool is unavailable, state the unverified check instead of claiming it passed.
