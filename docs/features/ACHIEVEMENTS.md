# Achievement System Documentation

## Overview

The Milokhelo Sports Platform features a comprehensive achievement system that automatically evaluates and awards achievements to users based on their performance in matches. Achievements motivate players, track progress, and recognize skill milestones across different sports.

## Features

- ✅ **Automatic Evaluation**: Achievements are automatically evaluated when user stats are updated
- ✅ **Event-Driven Architecture**: Integrated with stats update system via event bus
- ✅ **Multi-Sport Support**: Achievements can be sport-specific or cross-sport
- ✅ **Flexible Criteria**: Support for thresholds, totals, ratios, streaks, and composite conditions
- ✅ **Multiple Categories**: Milestone, skill, participation, social, and special achievements
- ✅ **Rarity Levels**: Common, rare, epic, and legendary achievements
- ✅ **Points System**: Each achievement awards points for gamification

## Architecture

### Component Diagram

```
┌─────────────────────┐
│   Match Finished    │
│       Event         │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  StatsUpdateHandler │
│                     │
│  - Updates stats    │
│  - Publishes event  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ user.stats_updated  │
│       Event         │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ AchievementEvaluator│
│                     │
│  - Loads criteria   │
│  - Evaluates stats  │
│  - Awards new       │
│    achievements     │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ user.achievement_   │
│      awarded        │
│       Event         │
└─────────────────────┘
```

### Components

#### 1. **AchievementEvaluator** (Domain Service)
- Location: `src/api/v1/modules/user/application/AchievementEvaluator.js`
- Evaluates user stats against achievement criteria
- Awards achievements that haven't been earned yet
- Publishes events when achievements are awarded

#### 2. **AchievementRepository**
- Location: `src/api/v1/modules/user/infrastructure/persistence/AchievementRepository.js`
- Manages achievement data persistence
- Provides methods to query achievements by category, sport, etc.

#### 3. **AchievementModel**
- Location: `src/api/v1/modules/user/infrastructure/persistence/AchievementModel.js`
- MongoDB schema for achievements
- Stores criteria as flexible JSON structure

## Achievement Criteria Types

### 1. Stat Threshold

Check if a single stat meets a threshold for any sport.

**Example**: Win 10 matches
```javascript
{
  type: 'stat_threshold',
  field: 'wins',
  operator: '>=',
  value: 10
}
```

### 2. Stat Total

Sum a stat across all sports and check against threshold.

**Example**: Play 100 matches across all sports
```javascript
{
  type: 'stat_total',
  field: 'matchesPlayed',
  operator: '>=',
  value: 100
}
```

### 3. Ratio

Calculate a ratio between two stats and check against threshold.

**Example**: Maintain 75% win rate
```javascript
{
  type: 'ratio',
  numerator: 'wins',
  denominator: 'matchesPlayed',
  operator: '>=',
  value: 0.75
}
```

### 4. Streak

Check for winning or losing streaks.

**Example**: Win 5 matches in a row
```javascript
{
  type: 'streak',
  streakType: 'winning',  // 'winning', 'losing', or omit for any
  operator: '>=',
  value: 5
}
```

### 5. Composite

Combine multiple conditions with AND/OR logic.

**Example**: 60% win rate with at least 20 matches
```javascript
{
  type: 'composite',
  logic: 'AND',
  conditions: [
    {
      type: 'ratio',
      numerator: 'wins',
      denominator: 'matchesPlayed',
      operator: '>=',
      value: 0.6
    },
    {
      type: 'stat_threshold',
      field: 'matchesPlayed',
      operator: '>=',
      value: 20
    }
  ]
}
```

## Supported Operators

- `>=` or `gte` - Greater than or equal to
- `>` or `gt` - Greater than
- `<=` or `lte` - Less than or equal to
- `<` or `lt` - Less than
- `===`, `==`, or `eq` - Equal to
- `!==`, `!=`, or `ne` - Not equal to

## Achievement Categories

### Milestone
Progress-based achievements for participation.
- Getting Started (5 matches)
- Dedicated Player (50 matches)
- Century Club (100 matches)
- Veteran (500 matches)

### Skill
Performance-based achievements for competitive success.
- Winner (10 wins)
- Champion (50 wins)
- Legend (100 wins)
- Skilled Competitor (60% win rate)
- Elite Performer (75% win rate)

### Participation
Activity-based achievements for engagement.
- First Blood (first goal/point)
- Scorer (50 goals)
- Team Player (10 assists)
- Playmaker (50 assists)

### Special
Unique achievements for specific accomplishments.
- Never Give Up (comeback after losing streak)

## Rarity Levels

1. **Common** - Easy to achieve, frequent awards (10-30 points)
2. **Rare** - Moderate difficulty (50-100 points)
3. **Epic** - Challenging achievements (150-250 points)
4. **Legendary** - Extremely difficult, prestigious (500-1000 points)

## API Usage

### Get User Achievements

```http
GET /api/v1/users/:id/achievements
```

**Response**:
```json
[
  {
    "id": "achievement_id",
    "name": "First Victory",
    "description": "Win your first match in any sport",
    "category": "milestone",
    "sport": "all",
    "rarity": "common",
    "points": 10,
    "badgeUrl": "https://example.com/badges/first-victory.png"
  }
]
```

### Get Current User's Achievements

```http
GET /api/v1/users/me/achievements
```

Requires authentication.

## Adding Custom Achievements

### 1. Create Achievement Definition

```javascript
{
  name: 'Hat Trick Hero',
  description: 'Score 3 or more goals in a single match',
  category: 'skill',
  sport: 'football',
  criteria: {
    type: 'stat_threshold',
    field: 'goalsScored',
    operator: '>=',
    value: 3
  },
  rarity: 'rare',
  points: 75,
  badgeUrl: '/badges/hat-trick.png'
}
```

### 2. Insert into Database

```javascript
import AchievementModel from './AchievementModel.js';

await AchievementModel.create({
  name: 'Hat Trick Hero',
  description: 'Score 3 or more goals in a single match',
  category: 'skill',
  sport: 'football',
  criteria: { /* ... */ },
  rarity: 'rare',
  points: 75
});
```

### 3. Achievement Will Auto-Evaluate

Once created, the achievement will automatically be evaluated for all users when their stats update.

## Event Flow

### Match Completion → Achievement Award

1. Match finishes → `match.finished` event published
2. `StatsUpdateHandler` updates user stats
3. `user.stats_updated` event published
4. `AchievementEvaluator` evaluates all achievements for user
5. New achievements awarded → `user.achievement_awarded` event published
6. Frontend can listen for events to show notifications

### Event Payloads

**user.stats_updated**
```javascript
{
  userId: 'user_id',
  sport: 'football',
  stats: { /* updated stats */ }
}
```

**user.achievement_awarded**
```javascript
{
  userId: 'user_id',
  achievementId: 'achievement_id',
  achievementName: 'First Victory',
  points: 10
}
```

## Performance Considerations

### Optimization Strategies

1. **Incremental Evaluation**: Only evaluates achievements user doesn't have
2. **Sport Filtering**: Can evaluate specific sport instead of all sports
3. **Efficient Queries**: Uses MongoDB indexes on userId, sport, category
4. **Event-Driven**: Evaluations triggered only when stats change

### Scalability

- **Async Processing**: Achievement evaluation happens asynchronously
- **Error Isolation**: Evaluation errors don't affect stats updates
- **Batch Processing**: Can process multiple achievements in one evaluation
- **Caching**: Achievement definitions can be cached (future enhancement)

## Testing

### Unit Tests

Location: `test/unit/achievementEvaluator.test.js`

Tests cover:
- All criteria types (threshold, total, ratio, streak, composite)
- All operators (>=, >, <=, <, ==, !=)
- Sport filtering
- Edge cases (zero values, missing stats)

Run tests:
```bash
npm test -- test/unit/achievementEvaluator.test.js
```

### Integration Tests

Location: `test/integration/achievementSystem.test.js`

Tests cover:
- Complete evaluation flow
- Database persistence
- Event publishing
- Multi-sport scenarios
- Edge cases

Run tests:
```bash
npm test -- test/integration/achievementSystem.test.js
```

## Predefined Achievements

The system comes with **31 predefined achievements** covering:

- **5 Milestone achievements** - Participation-based
- **13 Skill achievements** - Performance-based (wins, win rate, streaks, ELO)
- **7 Participation achievements** - Activity-based (goals, assists)
- **1 Special achievement** - Unique accomplishments

See `achievementSeeds.js` for complete list.

## Future Enhancements

### Planned Features

1. **Time-Based Achievements**
   - Daily/weekly/monthly challenges
   - Seasonal achievements

2. **Social Achievements**
   - Team-based achievements
   - Community milestones
   - Referral rewards

3. **Progressive Achievements**
   - Multi-tier achievements with levels
   - Progress tracking (e.g., "50% to next level")

4. **Achievement Collections**
   - Badge collections
   - Showcase on profile
   - Leaderboards by achievement points

5. **Custom Criteria Functions**
   - Support for complex custom logic
   - JavaScript function evaluation

6. **Achievement Notifications**
   - Push notifications on award
   - In-app celebration animations
   - Social sharing

## Troubleshooting

### Achievement Not Awarded

1. **Check Criteria**: Verify user stats meet all criteria conditions
2. **Check Already Earned**: User may already have the achievement
3. **Check Sport Filter**: Achievement may be sport-specific
4. **Check Logs**: Look for evaluation errors in logs

```javascript
// Manual evaluation for debugging
const evaluator = container.resolve('achievementEvaluator');
const awarded = await evaluator.evaluateAchievements(userId, sport);
console.log('Awarded:', awarded);
```

### Performance Issues

1. **Reduce Evaluation Frequency**: Batch stats updates if possible
2. **Index Optimization**: Ensure proper indexes on UserStat collection
3. **Cache Achievements**: Cache achievement definitions in memory
4. **Async Processing**: Move to background job queue for large evaluations

## Database Schema

### Achievement Collection

```javascript
{
  name: String,              // Unique achievement name
  description: String,       // Achievement description
  category: String,          // milestone|skill|participation|social|special
  sport: String,             // Sport name or 'all'
  criteria: Mixed,           // Flexible criteria object
  badgeUrl: String,          // URL to badge image
  rarity: String,            // common|rare|epic|legendary
  points: Number,            // Points awarded
  isActive: Boolean,         // Whether achievement is active
  createdAt: Date,
  updatedAt: Date
}
```

### User Achievements

Stored in User model's `achievements` array (references Achievement IDs).

## Related Documentation

- **Stats Auto-Update**: `docs/STATS_AUTO_UPDATE.md`
- **API Specification**: `docs/openapi.yaml`
- **Architecture**: `docs/ARCHITECTURE.md`

## Summary

The achievement system provides:
- ✅ 31 predefined achievements
- ✅ 5 criteria types with flexible logic
- ✅ Automatic evaluation on stats update
- ✅ Multi-sport support
- ✅ Event-driven architecture
- ✅ Comprehensive tests (40+ test cases)
- ✅ Full API integration

The system is production-ready and can be extended with custom achievements as needed.
