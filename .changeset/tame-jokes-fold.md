---
"honocord": minor
---

Export previously-internal types needed for full type coverage of the public API: `HonocordOptions`, `HonocordAppOptions`, `CommandInteraction`, `UserContextInteraction`, `MessageContextInteraction`, `AutocompleteInteraction`, `AutocompleteFocusedOption`, `APIModalData` (and its `BaseModalData`/`TextInputModalData`/`SelectMenuModalData` members), `BlankVariables`, `CachedDMChannel`, `CachedThreadChannel`, `CachedTextGuildChannel`, `CachedVoiceGuildChannel`, `NamespaceAccessor`, `MemberNamespaceAccessor`, and the `Colors` interface. These were already reachable through other exported types' signatures but couldn't be imported or named directly.

Also added comprehensive JSDoc coverage across the library's public classes, methods, and types, improving editor IntelliSense and powering the new auto-generated API reference docs.
