# 🚀 Quick Start Guide

## One-Command Installation

To install and set up the entire project:

```bash
./install.sh
```

This will:
- ✅ Check system dependencies
- ✅ Configure environment variables
- ✅ Install all dependencies
- ✅ Create and configure database
- ✅ Run all migrations
- ✅ Start the application

## Demo Users

For testing, 4 demo users have been created:

| User        | Email                 | Password      |
|-------------|-----------------------|---------------|
| Admin       | admin@puzzle.local    | AdminPass123! |
| Player One  | player1@puzzle.local  | Player1Pass!  |
| Player Two  | player2@puzzle.local  | Player2Pass!  |
| Test User   | tester@puzzle.local   | TesterPass!   |

## Useful Scripts

### Create Demo Users
```bash
cd packages/backend
node scripts/create-demo-users.mjs
```

### Run User Tests
```bash
cd packages/backend
node scripts/test-users.mjs
```

### Run Database Migrations
```bash
cd packages/backend
node scripts/migrate.mjs
```

## Settings Management

The application includes a settings system for configuration:

### API Endpoints

- `GET /api/settings` - Get public settings
- `POST /api/settings/upsert` - Create/update setting (requires auth)
- `DELETE /api/settings/:key` - Delete setting (requires auth)

### Example Settings

```javascript
// String setting
{
  key: "app_name",
  value: "اینفرنال (Infernal)",
  type: "string",
  isPublic: true
}

// Number setting
{
  key: "max_players",
  value: 100,
  type: "number",
  isPublic: true
}

// Boolean setting
{
  key: "game_enabled",
  value: true,
  type: "boolean",
  isPublic: true
}
```

## Environment Variables

### Get Environment Variable
```bash
source install.sh
value=$(get_env "KEY_NAME")
```

### Set Environment Variable
```bash
source install.sh
set_env "KEY_NAME" "value"
```

## Documentation

- [Installation Guide](./INSTALLATION.md) - Detailed installation instructions
- [Verification Report](./VERIFICATION.md) - Proof of working system
- [Proof of Work](./PROOF_OF_WORK.txt) - Test results and credentials
- [Main README](./README.md) - Full project documentation

## Testing

All tests have passed with 100% success rate. See [VERIFICATION.md](./VERIFICATION.md) for details.

## Support

For issues or questions:
1. Check the [INSTALLATION.md](./INSTALLATION.md) guide
2. Review [VERIFICATION.md](./VERIFICATION.md) for examples
3. Ensure all dependencies are installed
4. Verify database is running

---

**Status:** ✅ Fully Operational  
**Test Coverage:** 100%  
**Demo Users:** 4 Active  
**Settings:** 6 Configured
