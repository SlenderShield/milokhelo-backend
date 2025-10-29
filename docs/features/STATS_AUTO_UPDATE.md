# Stats Auto-Update System

## Overview

The stats auto-update system automatically updates user statistics when matches are finished. This feature uses an event-driven architecture to decouple match completion from stats calculation, ensuring maintainability and scalability.

## Architecture

### Components

1. **MatchService** (`src/api/v1/modules/match/application/MatchService.js`)
   - Publishes `match.finished` event when a match completes
   - Includes match ID and result data in the event payload

2. **StatsUpdateHandler** (`src/api/v1/modules/user/application/StatsUpdateHandler.js`)
   - Subscribes to `match.finished` events
   - Calculates stats changes for all participants
   - Updates user stats in the database

3. **UserRepository** (`src/api/v1/modules/user/infrastructure/persistence/UserRepository.js`)
   - Handles atomic stat updates using MongoDB's `$inc` operator
   - Special handling for streak calculation

4. **EventBus** (`src/core/events/`)
   - Provides pub/sub mechanism for event communication
   - Supports both in-memory and Redis-based implementations

### Event Flow

```
Match Finish → MatchService.finishMatch()
                   ↓
            eventBus.publish('match.finished')
                   ↓
         StatsUpdateHandler.handleMatchFinished()
                   ↓
      [Process each participant]
                   ↓
         UserRepository.updateStats()
                   ↓
         [Stats Updated in Database]
```

## Features

### Tracked Statistics

For each sport, the system tracks:

- **matchesPlayed**: Total matches played
- **wins**: Number of wins
- **losses**: Number of losses
- **draws**: Number of draws
- **goalsScored**: Total goals/points scored
- **assists**: Total assists (if provided)
- **fouls**: Total fouls (if provided)
- **elo**: ELO rating (simplified implementation)
- **streak**: Current winning/losing streak

### Match Outcome Detection

The system automatically determines match outcome based on:

1. **Individual Matches**: Compares participant scores
   - Highest score = win
   - Multiple players with same highest score = draw
   - Lower score = loss

2. **Team-Based Matches**: Compares team scores
   - Team with highest score wins
   - Equal scores = draw

### ELO Rating System

Simplified ELO implementation:

- **Competitive matches**: ±32 points per win/loss
- **Friendly matches**: ±16 points per win/loss
- **Draws**: No ELO change
- Base rating: 1000

### Streak Tracking

- **Winning streak**: Increments on consecutive wins
- **Losing streak**: Decrements on consecutive losses (negative numbers)
- **Draws**: Maintain current streak without change
- Streaks reset when outcome changes (win → loss or loss → win)

### Multi-Sport Support

Stats are tracked separately for each sport:

```javascript
{
  userId: "user123",
  sport: "football",
  wins: 10,
  elo: 1150,
  // ...
}

{
  userId: "user123",
  sport: "basketball",
  wins: 5,
  elo: 1050,
  // ...
}
```

## Usage

### Match Completion

When finishing a match, provide scores in the result object:

#### Simple Scores (numeric)

```javascript
await matchService.finishMatch(matchId, userId, {
  scores: {
    'user1_id': 5,
    'user2_id': 3,
    'user3_id': 4
  }
});
```

#### Detailed Scores (object)

```javascript
await matchService.finishMatch(matchId, userId, {
  scores: {
    'user1_id': {
      goals: 3,
      assists: 2,
      fouls: 1
    },
    'user2_id': {
      goals: 1,
      assists: 1,
      fouls: 3
    }
  }
});
```

### Retrieving User Stats

```javascript
// Get all stats for a user
const stats = await userService.getUserStats(userId);

// Returns array of stats by sport:
// [
//   { sport: 'football', wins: 10, losses: 5, elo: 1150, ... },
//   { sport: 'basketball', wins: 8, losses: 3, elo: 1200, ... }
// ]
```

## Implementation Details

### Event Subscription

The user module automatically subscribes to match events during initialization:

```javascript
// src/api/v1/modules/user/index.js
export function initializeUserModule(container) {
  // ... register services ...
  
  const statsUpdateHandler = container.resolve('statsUpdateHandler');
  
  eventBus.subscribe('match.finished', async (data) => {
    if (!statsUpdateHandler.matchRepository) {
      statsUpdateHandler.matchRepository = container.resolve('matchRepository');
    }
    await statsUpdateHandler.handleMatchFinished(data);
  });
}
```

### Error Handling

The system is designed to be resilient:

1. **Per-participant error isolation**: If updating stats for one participant fails, others continue
2. **Logging**: All errors are logged with context for debugging
3. **Graceful degradation**: Missing or invalid data is handled without crashing

### Atomic Updates

Stats updates use MongoDB's `$inc` operator for atomic increments:

```javascript
await UserStatModel.findOneAndUpdate(
  { userId, sport },
  { $inc: { wins: 1, matchesPlayed: 1, elo: 32 } },
  { new: true, upsert: true }
);
```

## Testing

### Unit Tests

22 comprehensive unit tests cover:

- Match outcome determination
- Stats calculation logic
- ELO rating changes
- Error handling
- Team-based matches

Run unit tests:

```bash
npm run test:unit -- --grep "StatsUpdateHandler"
```

### Integration Tests

Integration tests verify the complete flow:

- Event publishing and subscription
- Database updates
- Multi-match streak tracking
- Multi-sport support

Run integration tests:

```bash
npm run test:integration -- --grep "Stats Auto-Update"
```

## Performance Considerations

1. **Asynchronous Processing**: Stats updates happen asynchronously via events
2. **Parallel Updates**: Each participant's stats are updated in parallel using `Promise.all`
3. **Atomic Operations**: MongoDB's atomic operators prevent race conditions
4. **Indexed Queries**: `userId` and `sport` are indexed for fast lookups

## Future Enhancements

Potential improvements:

1. **Advanced ELO**: Implement proper ELO algorithm with opponent rating consideration
2. **Rating History**: Track rating changes over time
3. **Stat Aggregations**: Weekly/monthly/yearly stat summaries
4. **Achievement Integration**: Automatically evaluate achievement criteria on stat changes
5. **Leaderboards**: Real-time leaderboard updates based on stats
6. **Stat Validation**: Validate stat changes against match data
7. **Rollback Support**: Ability to rollback stats if match result is disputed

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - Overall system architecture
- [Event Bus](../src/core/events/README.md) - Event bus implementation details
- Match Module - Match management and lifecycle
- User Module - User profile and stats management

## Troubleshooting

### Stats Not Updating

1. Check match status is set to `finished`
2. Verify `scores` object is provided in match result
3. Check event bus logs for publication/subscription issues
4. Verify user IDs in scores match participant IDs

### Incorrect Stats

1. Verify match scores are accurate
2. Check match type (competitive vs friendly) for ELO calculation
3. Review logs for any errors during processing

### Performance Issues

1. Monitor event bus performance
2. Check database query performance on UserStat collection
3. Consider adding more specific indexes if queries are slow
4. Review error logs for failed updates being retried
