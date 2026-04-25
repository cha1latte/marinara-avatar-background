# Speaker Avatar Background (Group Chat)

A client-side extension for [Marinara Engine](https://github.com/Pasta-Devs/Marinara-Engine) that renders the currently-speaking character's avatar as a soft, blurred, dimmed background behind the chat area in group Conversation chats. The background cross-fades smoothly to whoever spoke last. In 1:1 chats, Roleplay mode, Visual Novel mode, and Game mode the extension does nothing.

## Installation

1. Open Marinara Engine.
2. Go to **Settings → Extensions → Add Extension**.
3. Open `speaker-avatar-background.json` from this folder, copy its full contents, and paste into the Add Extension dialog.
4. Save and confirm the extension is **enabled** in the extension list.

The extension takes effect immediately — no reload required.

## Turning it on and off

Use the **Settings → Extensions** toggle next to the extension name. There is no in-app overlay control; flipping it off removes the background and the injected styles immediately, flipping it on restores them.

If your OS has `prefers-reduced-motion: reduce`, transitions are disabled automatically and speaker swaps become instant — no setting required.

## Customising the look

Press **Ctrl+Shift+A** at any time to open the settings panel. You can:

- Toggle the background on or off without disabling the extension itself.
- Adjust **opacity** (default 0.3) — higher = more visible avatar.
- Adjust **blur** (default 12 px) — higher = softer, lower = sharper.
- Click **Reset** to restore defaults.

All settings persist in `localStorage` and survive reloads.

If you prefer setting things via CSS instead, opacity and blur are also exposed as custom properties (`--saab-opacity`, `--saab-blur`) and can be overridden in **Settings → Custom CSS**.

## How it works

- Detects Conversation mode via the `[data-component="ChatArea.Conversation"]` marker on the surface root.
- Detects group chats by counting distinct assistant-speaker avatars in the rendered message list — if two or more distinct names are present, it is treated as a group.
- Reads the latest speaker's avatar straight from the rendered avatar circle (`div.h-10.w-10.overflow-hidden.rounded-full > img`) on the most recent assistant turn. The same selector hits both the standard and merged group-chat render paths. No API calls.
- Uses two stacked background layers and cross-fades between them on speaker change to avoid the `background-image` flash that a single layer would cause.
- A scoped `MutationObserver` on `.mari-messages-scroll` (throttled to 150 ms) drives speaker updates. A 1 s poll watches for surface mounts/unmounts so chat-mode switches are picked up without observing `document.body`.

## Known limitations

- **DOM-dependent.** The extension targets stable selectors in Marinara Engine v1.5.5 (`[data-component="ChatArea.Conversation"]`, `.mari-messages-scroll`, the avatar circle wrapper, and `.mari-message-user` for filtering the persona avatar). If a future engine version renames or restructures these, the effect will silently no-op until the selectors are updated here.
- **Group Conversation only.** Roleplay, Visual Novel, Game mode, and 1:1 chats do nothing by design.
- **Missing avatars.** If the speaking character has no avatar configured, the background fades to invisible until a speaker with an avatar takes over.
- **No avatar pre-warming.** The image probe runs only when the speaker actually changes, so the first swap may have a small load delay on slow networks. Subsequent swaps are instant because the browser has already cached the image.

## Compatibility

- Built and tested against **Marinara Engine v1.5.5+**.
- Browser-sandboxed; runs in any browser Marinara supports.
- No Node, no filesystem, no external dependencies, no new API endpoints, no schema changes.
