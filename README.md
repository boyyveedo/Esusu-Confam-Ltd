# Esusu Confam - Group Management API

A clean architecture NestJS application for managing user groups with authentication, join requests, and invitation systems.

##  Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- pnpm/yarn

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma generate
npx prisma migrate dev

# Start development server
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

##  Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/esusu_confam_db"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

##  API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user

### Groups
- `POST /groups` - Create group
- `GET /groups/search` - Search public groups
- `GET /groups/my-group` - Get user's group
- `POST /groups/:id/join` - Request to join
- `PUT /groups/:id/join-requests` - Approve/reject requests
- `POST /groups/:id/invite` - Invite to private group
- `POST /groups/accept-invite/:code` - Accept invite
- `DELETE /groups/:id/leave` - Leave group



##  Usage Examples

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","phoneNumber":"+1234567890","password":"password123"}'
```

**Create Group:**
```bash
curl -X POST http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Group","description":"Test group","maxCapacity":10,"visibility":"PUBLIC"}'
```

##  Key Features

- **Authentication**: JWT-based with bcrypt password hashing
- **Groups**: Public/private with capacity limits
- **Business Rules**: One group per user, role-based permissions
- **Search**: Paginated public group search
- **Invitations**: Unique codes for private groups
- **Clean Architecture**: SOLID principles, separation of concerns

##  Scripts

```bash
pnpm run start:dev      # Development with hot reload
pnpm run build          # Production build
pnpm run start:prod     # Start production server
pnpm run test           # Run tests
pnpm run prisma:studio  # Open database GUI
```

##  Database Models

- **User**: Authentication and profile
- **Group**: Group metadata and settings
- **GroupMember**: User memberships with roles
- **JoinRequest**: Public group join requests
- **GroupInvite**: Private group invitations

##  Business Rules

- Users can only join one group at a time
- Groups have maximum capacity limits
- Public groups: anyone can request to join
- Private groups: invitation-only with unique codes
- Admins can manage requests and invite users
- Group owners cannot be removed

---

Built with NestJS, Prisma, and PostgreSQL