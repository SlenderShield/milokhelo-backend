# DTO (Data Transfer Object) Usage Guide

## Overview

DTOs (Data Transfer Objects) are used to transform database models into safe objects for client consumption. They provide a consistent way to:

- **Filter sensitive data**: Remove passwords, OAuth tokens, internal IDs
- **Apply privacy settings**: Respect user privacy preferences
- **Control data exposure**: Show different fields based on context
- **Transform data format**: Convert MongoDB ObjectIds to strings, format nested objects

## Available DTOs

All DTOs are located in `src/common/dto/`:

- `UserDTO` - User profiles and authentication data
- `TeamDTO` - Team information and members
- `MatchDTO` - Match/game data
- `TournamentDTO` - Tournament information
- `VenueDTO` - Venue and facility data
- `NotificationDTO` - User notifications
- `ChatDTO` - Chat messages and rooms
- `CalendarDTO` - Calendar events
- `InvitationDTO` - Invitations and requests
- `FeedbackDTO` - User feedback and support tickets
- `UserStatDTO` - User statistics and performance data
- `AchievementDTO` - Achievement definitions and progress
- `MapsDTO` - Map locations and markers

## Basic Usage

### Import DTOs

```javascript
import { UserDTO, TeamDTO, MatchDTO } from '@/common/dto/index.js';
```

### Transform Single Document

```javascript
// In a controller or service
const user = await UserModel.findById(userId);
const safeUser = UserDTO.transform(user);

res.json(safeUser);
```

### Transform Multiple Documents

```javascript
const users = await UserModel.find({ role: 'user' });
const safeUsers = UserDTO.transformMany(users);

res.json(safeUsers);
```

## Advanced Usage

### Passing Options

DTOs accept options to control what data is included:

```javascript
// Include timestamps
const user = UserDTO.transform(userDoc, { includeTimestamps: true });

// Owner viewing their own profile (shows private data)
const user = UserDTO.transform(userDoc, { 
  isOwner: true, 
  showPrivate: true 
});

// Team captain viewing team (shows join code)
const team = TeamDTO.transform(teamDoc, { isCaptain: true });

// Admin viewing feedback (shows admin-only fields)
const feedback = FeedbackDTO.transform(feedbackDoc, { isAdmin: true });
```

### Using Minimal Transforms

For lists and cards, use minimal transforms to reduce payload size:

```javascript
// User list for search results
const users = await UserModel.find({ name: /john/i });
const safeUsers = users.map(u => UserDTO.transformMinimal(u));

// Match cards for homepage
const matches = await MatchModel.find({ status: 'scheduled' });
const matchCards = matches.map(m => MatchDTO.transformMinimal(m));
```

### Custom Transforms

Some DTOs have specialized transform methods:

```javascript
// User search results (optimized for search)
const results = users.map(u => UserDTO.transformForSearch(u));

// Map markers (minimal data for map display)
const markers = locations.map(l => MapsDTO.transformForMap(l));

// Chat rooms (different structure than messages)
const rooms = chatRooms.map(r => ChatDTO.transformRoom(r));

// Stats summary (aggregated across sports)
const summary = UserStatDTO.transformSummary(allUserStats);
```

## Integration Examples

### In Controllers

```javascript
class UserController {
  getMe() {
    return asyncHandler(async (req, res) => {
      const userId = req.user.id;
      const user = await this.userService.getUserProfile(userId);
      
      // Transform with owner privileges
      const safeUser = UserDTO.transform(user, { 
        isOwner: true,
        showPrivate: true,
        includeTimestamps: true 
      });
      
      res.json(safeUser);
    });
  }

  getUserProfile() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const user = await this.userService.getUserProfile(id);
      
      // Transform respecting privacy settings
      const safeUser = UserDTO.transform(user, { 
        isOwner: currentUserId === id,
        showPrivate: currentUserId === id 
      });
      
      res.json(safeUser);
    });
  }

  searchUsers() {
    return asyncHandler(async (req, res) => {
      const users = await this.userService.searchUsers(req.query.q);
      
      // Use search-optimized transform
      const results = users.map(u => UserDTO.transformForSearch(u));
      
      res.json(results);
    });
  }
}
```

### In Services

```javascript
class UserService {
  async getUserProfile(userId) {
    const user = await this.userRepository.findById(userId);
    
    // Service returns DTO-transformed data
    return UserDTO.transform(user, { includeTimestamps: true });
  }

  async getFriends(userId) {
    const user = await this.userRepository.findById(userId, {
      populate: 'friends'
    });
    
    // Transform friends list
    return user.friends.map(friend => UserDTO.transformMinimal(friend));
  }
}
```

### With Pagination

```javascript
async listMatches(filters, page, limit) {
  const result = await this.matchRepository.findPaginated(filters, { page, limit });
  
  return {
    items: MatchDTO.transformMany(result.items),
    pagination: result.pagination
  };
}
```

## Security Best Practices

### 1. Always Use DTOs for API Responses

❌ **Bad** - Exposes all fields including sensitive data:
```javascript
const user = await UserModel.findById(id);
res.json(user); // Contains password, OAuth tokens, etc.
```

✅ **Good** - Only exposes safe fields:
```javascript
const user = await UserModel.findById(id);
const safeUser = UserDTO.transform(user);
res.json(safeUser); // Password, tokens excluded
```

### 2. Respect Privacy Settings

```javascript
const user = await UserModel.findById(id);
const currentUserId = req.user?.id;

const safeUser = UserDTO.transform(user, {
  isOwner: currentUserId === id, // Only owner sees private data
  showPrivate: currentUserId === id
});
```

### 3. Use Minimal Transforms for Lists

```javascript
// List view - minimal data
const teams = await TeamModel.find();
const teamCards = teams.map(t => TeamDTO.transformMinimal(t));

// Detail view - full data
const team = await TeamModel.findById(id);
const fullTeam = TeamDTO.transform(team, { 
  isCaptain: req.user.id === team.captainId 
});
```

### 4. Handle Populated References

```javascript
const match = await MatchModel.findById(id)
  .populate('organizerId', 'name username avatar')
  .populate('participants', 'name username avatar');

// DTO handles populated fields automatically
const safeMatch = MatchDTO.transform(match);
```

## What Gets Filtered

### UserDTO Excludes:
- `password` - Never sent to client
- `oauthTokens` - Sensitive OAuth refresh tokens
- `__v` - MongoDB version key
- Private fields based on privacy settings

### TeamDTO Excludes:
- `joinCode` - Only shown to captain/members

### FeedbackDTO Excludes:
- `respondedBy` - Only shown to admins
- `response` - Only shown to admins or feedback owner

### General Exclusions:
- MongoDB `__v` field
- Internal implementation details
- Sensitive authentication data

## Creating Custom DTOs

To create a new DTO:

```javascript
import BaseDTO from './BaseDTO.js';

class MyModelDTO extends BaseDTO {
  static transformOne(model, options = {}) {
    if (!model) return null;

    const safe = {
      id: model._id?.toString(),
      publicField: model.publicField,
      // Conditional fields
      privateField: options.isOwner ? model.privateField : undefined,
      adminField: options.isAdmin ? model.adminField : undefined,
    };

    if (options.includeTimestamps) {
      safe.createdAt = model.createdAt;
      safe.updatedAt = model.updatedAt;
    }

    return this.clean(safe);
  }

  // Optional: Add minimal transform
  static transformMinimal(model) {
    if (!model) return null;
    
    const obj = model.toObject ? model.toObject() : model;
    
    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      status: obj.status,
    });
  }
}

export default MyModelDTO;
```

## Common Patterns

### Owner vs Public View

```javascript
const isOwner = req.user.id === resource.userId;
const safe = ResourceDTO.transform(resource, { isOwner });
```

### Role-Based Fields

```javascript
const isAdmin = req.user.roles.includes('admin');
const isModerator = req.user.roles.includes('moderator');
const safe = ResourceDTO.transform(resource, { isAdmin, isModerator });
```

### Paginated Lists

```javascript
const { items, pagination } = await service.findPaginated(filters, page, limit);
res.json({
  items: ItemDTO.transformMany(items),
  pagination
});
```

### Nested/Populated Data

```javascript
// DTOs automatically handle populated references
const match = await MatchModel.findById(id)
  .populate('organizerId')
  .populate('participants');
  
const safeMatch = MatchDTO.transform(match);
// organizerId and participants are safely transformed
```

## Testing DTOs

```javascript
import { UserDTO } from '@/common/dto/index.js';

describe('UserDTO', () => {
  it('should exclude sensitive fields', () => {
    const user = {
      _id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      oauthTokens: { google: 'secret_token' }
    };
    
    const result = UserDTO.transform(user);
    
    expect(result.password).toBeUndefined();
    expect(result.oauthTokens).toBeUndefined();
    expect(result.name).toBe('John Doe');
  });
  
  it('should respect privacy settings', () => {
    const user = {
      _id: '123',
      name: 'John Doe',
      phone: '1234567890',
      privacy: { showPhone: false }
    };
    
    const result = UserDTO.transform(user, { isOwner: false });
    
    expect(result.phone).toBeUndefined();
  });
});
```

## Migration Guide

To adopt DTOs in existing code:

1. **Controllers**: Wrap responses with DTO transforms
   ```javascript
   // Before
   res.json(user);
   
   // After
   res.json(UserDTO.transform(user));
   ```

2. **Services**: Return DTO-transformed data
   ```javascript
   // Before
   return await this.repository.findById(id);
   
   // After
   const doc = await this.repository.findById(id);
   return UserDTO.transform(doc);
   ```

3. **Lists**: Use transformMany or minimal transforms
   ```javascript
   // Before
   return await this.repository.find(filters);
   
   // After
   const docs = await this.repository.find(filters);
   return UserDTO.transformMany(docs);
   ```

## Performance Considerations

- DTOs add minimal overhead (object mapping)
- Use `transformMinimal()` for large lists to reduce payload size
- DTOs work with populated Mongoose documents automatically
- Consider caching transformed results for frequently accessed data

## Summary

✅ **Always use DTOs** for API responses
✅ **Choose appropriate transform** (full, minimal, custom)
✅ **Pass context options** (isOwner, isAdmin, etc.)
✅ **Respect privacy settings** and user preferences
✅ **Test DTO transformations** to ensure security

DTOs provide a **security layer** that prevents accidental exposure of sensitive data while giving you full control over what clients receive.
