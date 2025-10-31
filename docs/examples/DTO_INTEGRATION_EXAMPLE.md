# DTO Integration Example

This document shows real-world examples of integrating DTOs into controllers.

## Quick Reference

```javascript
import { UserDTO, TeamDTO, MatchDTO } from '@/common/dto/index.js';

// Single document
const safe = UserDTO.transform(document);

// Multiple documents  
const safeList = UserDTO.transformMany(documents);

// With options
const safe = UserDTO.transform(document, {
  isOwner: true,
  includeTimestamps: true
});

// Minimal (for lists)
const minimal = UserDTO.transformMinimal(document);
```

See **docs/guides/DTO_USAGE_GUIDE.md** for complete documentation.
