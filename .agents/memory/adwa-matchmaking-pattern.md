---
name: ADWA matchmaking — AI opponent must exist in DB
description: The backend requires both players to exist in the players table before a match can be created. AI opponents must be created via API before the match.
---

# Matchmaking requires both players in DB

The `/matches` POST route validates that both `whiteAddress` and `blackAddress` exist in `playersTable`. A randomly generated address that doesn't exist in the DB will cause match creation to fail.

**Rule:** Before calling `createMatch`, call `createPlayer` to upsert the AI opponent into the DB.

**Pattern in play.tsx:**
1. Generate a pseudo-random AI address (e.g. `0xAI{suffix}000...`)
2. Call `createPlayer.mutateAsync({ data: { walletAddress, displayName, house } })`
3. Then call `createMatch.mutateAsync(...)` with that same address

**Why:** The backend enforces referential integrity via explicit player lookup before recording a match.
