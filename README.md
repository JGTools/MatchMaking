# MatchMaking

[![npm](https://img.shields.io/npm/v/@jgtools/matchmaking)](https://www.npmjs.com/package/@jgtools/matchmaking)
[![npm](https://img.shields.io/npm/dm/@jgtools/matchmaking)](https://www.npmjs.com/package/@jgtools/matchmaking)
[![GitHub](https://img.shields.io/github/license/jgtools/matchmaking)](https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt)

MatchMaking system for online games

## Installation

### Using npm

```bash
npm i @jgtools/matchmaking
```

```javascript
import MatchMaking from "@jgtools/matchmaking";
// ...
```

### Using cdn

```html
<script type="module">
    import MatchMaking from "https://cdn.jsdelivr.net/npm/@jgtools/matchmaking@1.0.2/dist/index.min.js";
    // ...
</script>
```

## Usage

```typescript
import MatchMaking, { Lobby, Match } from "@jgtools/matchmaking";

const config = {
  TEAM_SIZE: 5,
  TEAMS_PER_MATCH: 2,
  MM_INTERVAL: 1000,
  MAX_DIFF_START: 0.02,
  INCREASE_DIFF_TIME: 60000,
  CLEAR_INTERVAL: 3600000,
  CLEAR_AFTER_QUE_TIME: 7200000,
};
const onMatchesFound = (matches: Match[]) => {
  // do something with matches that were created
};
const mm = new MatchMaking(onMatchesFound, config);

// add lobby to matchmaking
const lobby: Lobby = {
  id: "123",
  rank: 0.7,
  members: 3,
};
mm.addToQue(lobby);
```

## License

MIT
