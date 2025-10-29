# 📚 Documentation

This directory contains all permanent project documentation, organized into logical subdirectories for better maintainability.

## 📂 Directory Structure

```
docs/
├── architecture/       # System design and architecture
├── guides/            # Development guides and references
├── features/          # Feature-specific documentation
├── api/              # API specifications and updates
└── README.md         # This file
```

## 📖 Contents

### 🏗️ Architecture (`architecture/`)

System design, architecture patterns, and historical context:

- **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** - System architecture and design patterns
- **[CODEBASE_ANALYSIS.md](architecture/CODEBASE_ANALYSIS.md)** - Comprehensive codebase analysis (historical)
- **[REFACTORING_HISTORY.md](architecture/REFACTORING_HISTORY.md)** - Complete refactoring history (Phase 1 & Phase 2)
- **[RESTRUCTURING.md](architecture/RESTRUCTURING.md)** - Codebase restructuring documentation and migration guide

### 📚 Development Guides (`guides/`)

Getting started, development patterns, and best practices:

- **[QUICKSTART.md](guides/QUICKSTART.md)** - Quick start guide for new developers
- **[DEVELOPMENT_GUIDELINES.md](guides/DEVELOPMENT_GUIDELINES.md)** - Complete development guidelines and patterns
- **[QUICK_REFERENCE.md](guides/QUICK_REFERENCE.md)** - Quick reference for common patterns
- **[PATH_ALIASING.md](guides/PATH_ALIASING.md)** - Path aliasing setup and usage
- **[IMPROVEMENTS.md](guides/IMPROVEMENTS.md)** - Improvement tracking and technical debt

**👉 Start here:** If you're new to the project, begin with [QUICKSTART.md](guides/QUICKSTART.md)

### ✨ Feature Documentation (`features/`)

Detailed documentation for specific features and implementations:

**Tournaments & Matches:**
- **[BRACKET_GENERATION.md](features/BRACKET_GENERATION.md)** - Tournament bracket generation (knockout & league)
- **[STATS_AUTO_UPDATE.md](features/STATS_AUTO_UPDATE.md)** - Automatic stats updates on match completion
- **[ACHIEVEMENTS.md](features/ACHIEVEMENTS.md)** - Complete achievement system documentation with auto-evaluation

**Venue Bookings:**

- **[BOOKING_CONFLICT_PREVENTION.md](features/BOOKING_CONFLICT_PREVENTION.md)** - Complete atomic booking system with transactions
- **[BOOKING_QUICK_REFERENCE.md](features/BOOKING_QUICK_REFERENCE.md)** - Quick reference guide for developers

**Authentication:**

- **[OAUTH_SETUP.md](features/OAUTH_SETUP.md)** - Complete OAuth setup guide (Google & Facebook)
- **[OAUTH_IMPLEMENTATION.md](features/OAUTH_IMPLEMENTATION.md)** - OAuth implementation details and architecture

### 🔌 API Documentation (`api/`)

API specifications and documentation updates:

- **[openapi.yaml](api/openapi.yaml)** - OpenAPI 3.1 specification with 70+ endpoints
- **[DOCUMENTATION_UPDATE.md](api/DOCUMENTATION_UPDATE.md)** - API documentation update history

**👉 View interactive docs:** Run the server and visit `/docs` endpoint

## 📋 Organization Rules

- Keep documentation **up-to-date** with code changes
- Use **clear headings and structure** for readability
- Include **code examples** where appropriate
- **Link between related documents** using relative paths
- Review and update after major refactors
- Place new docs in the appropriate subdirectory

### Adding New Documentation

When adding new documentation:

1. **Architecture docs** → `architecture/` - System design, patterns, refactoring history
2. **Development guides** → `guides/` - Tutorials, guidelines, references
3. **Feature docs** → `features/` - Feature-specific implementations and guides
4. **API docs** → `api/` - API specifications and related updates

## 🔄 Documentation Status

**Last Major Update**: October 29, 2025

**Recent Changes**:

- ✅ **Reorganized into subdirectories** - Better navigation and organization
- ✅ **Removed overlapping documentation** - Deleted redundant implementation summaries and moved content to main feature docs
- ✅ Consolidated refactoring history into single REFACTORING_HISTORY.md
- ✅ Updated ARCHITECTURE.md to reflect module independence (no shared/additional directories)
- ✅ Enhanced OpenAPI spec with comprehensive endpoint documentation and schemas
- ✅ Added comprehensive development guidelines and quick reference guides

## 📁 File Organization

### Subdirectory Purposes

- **`architecture/`** - High-level system design, architecture patterns, and historical context
- **`guides/`** - Practical guides for developers (getting started, patterns, references)
- **`features/`** - Deep dives into specific features (tournaments, bookings, OAuth, achievements)
- **`api/`** - API specifications (OpenAPI) and API documentation updates

### Temporary Documentation

For scratch work or temporary outputs, use `temp_docs/` instead.

---

## 🔍 Quick Links

**New Developer?** Start with [guides/QUICKSTART.md](guides/QUICKSTART.md)  
**Understanding the System?** Read [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)  
**Need API Reference?** Check [api/openapi.yaml](api/openapi.yaml)  
**Working on a Feature?** Browse [features/](features/) directory

---

**Note:** This is permanent documentation. For temporary or auto-generated docs, use the `temp_docs/` directory.
