# Deployment & Testing Guide
# Universal User Experience System

**Version**: 1.0.0
**Date**: 2025-10-02
**Status**: Ready for Staging Deployment (79.5% Complete)

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL or SQLite database
- npm or yarn package manager

### 1. Install Dependencies

```bash
cd cankao/tavernai-plus
npm install
```

### 2. Configure Environment

Create `.env` files in both apps:

**apps/api/.env**:
```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:pass@localhost:5432/tavernai"  # PostgreSQL for production

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:3000"

# AI Services (Optional)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

**apps/web/.env**:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
NODE_ENV=development
```

### 3. Initialize Database

```bash
# From project root
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database with test data
npm run db:seed
```

### 4. Start Development Servers

**Terminal 1 - Backend API**:
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend Web**:
```bash
cd apps/web
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (run `npx prisma studio`)

---

## 🧪 Manual Testing Checklist

### Phase 1: Authentication & Basic Access

- [ ] **Register New User**
  - Navigate to /register
  - Create account with email/password
  - Verify success message
  - Check database for new user record

- [ ] **Login**
  - Navigate to /login
  - Login with created credentials
  - Verify redirect to home page
  - Check JWT token in localStorage
  - Verify token contains `featureUnlocks` array

- [ ] **Session Persistence**
  - Refresh page
  - Verify still logged in
  - Check token refresh mechanism

### Phase 2: Feature Gating System

- [ ] **Check Initial Feature Unlocks**
  - Open browser DevTools → Network tab
  - Check `/api/v1/features/unlocks` response
  - Verify default unlocked features (F1, F2, F3, F8, F9, F10)

- [ ] **Unlock New Feature**
  - Use API endpoint: `POST /api/v1/features/unlock`
  ```json
  {
    "featureId": "F5",
    "unlockMethod": "manual"
  }
  ```
  - Verify feature appears in unlocks list
  - Check UI updates to show newly unlocked feature

- [ ] **Feature Gate Route Protection**
  - Try to access `/creator-studio` without Creator role
  - Verify redirect to subscription page
  - Try to access `/admin-console` without Admin role
  - Verify redirect to home page

### Phase 3: Role-Based Dashboards

#### Creator Studio (`/creator-studio`)
- [ ] **Access Control**
  - Update user role to 'creator' in database
  - Unlock feature F4 (Creator Studio)
  - Navigate to `/creator-studio`
  - Verify dashboard loads

- [ ] **Components Verification**
  - [ ] CreatorWorksSummary displays stats
  - [ ] AIGenerationPanel shows tabs (Character/Scenario)
  - [ ] CreatorRevenueChart renders (may show $0 for new account)
  - [ ] All cards and sections render without errors

- [ ] **AI Generation** (if API keys configured)
  - Click "Character" tab
  - Enter prompt: "A mysterious wizard"
  - Click "Generate"
  - Verify generation request
  - Check response handling

#### Gamification Dashboard (`/tavern`)
- [ ] **Access Control**
  - Unlock feature F5 (Gamification)
  - Navigate to `/tavern`
  - Verify dashboard loads

- [ ] **Components Verification**
  - [ ] Overview stats display (Level, Affinity, etc.)
  - [ ] AffinityProgressCard shows character relationships
  - [ ] ProficiencySkillTree displays skill grid
  - [ ] DailyQuestPanel shows quests
  - [ ] AchievementWall displays achievements
  - [ ] All cards render without errors

#### Admin Console (`/admin-console`)
- [ ] **Access Control**
  - Update user role to 'admin' in database
  - Unlock feature F6 (Admin Console)
  - Navigate to `/admin-console`
  - Verify dashboard loads

- [ ] **Components Verification**
  - [ ] Dashboard metrics cards display
  - [ ] RealTimeMonitor shows system metrics
  - [ ] AlertCenter displays alerts (may be empty)
  - [ ] ModerationQueue shows items (may be empty)
  - [ ] All components render without errors

### Phase 4: Onboarding & Tutorials

- [ ] **MBTI Quiz**
  - Create new user or logout
  - Navigate to onboarding flow
  - Complete MBTI quiz (8 questions)
  - Verify personality type calculated correctly
  - Check result description displays

- [ ] **Tutorial Overlay**
  - Navigate to feature with tutorial
  - Verify overlay appears
  - Check element highlighting works
  - Test step navigation (Next, Back, Skip)
  - Verify tutorial completes

- [ ] **Tutorial Tooltip**
  - Hover over elements with tooltips
  - Verify tooltip positioning (top, bottom, left, right)
  - Test auto-dismiss functionality
  - Check responsive behavior

### Phase 5: Notification System

#### REST API Notifications
- [ ] **Fetch Notifications**
  - Navigate to notification center
  - Verify notifications load
  - Check unread count badge
  - Test filtering (All, Unread, Urgent)

- [ ] **Mark as Read**
  - Click notification
  - Verify marked as read
  - Check unread count decrements

- [ ] **Delete Notification**
  - Delete a notification
  - Verify removed from list

#### WebSocket Real-Time Notifications
- [ ] **Connection**
  - Open browser DevTools → Network → WS tab
  - Verify WebSocket connection established
  - Check connection URL contains auth token

- [ ] **Real-Time Delivery**
  - Create notification via API:
  ```bash
  POST /api/v1/notifications
  {
    "userId": "your-user-id",
    "title": "Test Notification",
    "message": "This is a real-time test",
    "type": "info",
    "priority": "urgent"
  }
  ```
  - Verify toast notification appears instantly
  - Check notification added to notification center
  - Verify unread count updates

- [ ] **Toast Behavior**
  - Create urgent notification
  - Verify toast doesn't auto-dismiss (duration: 0)
  - Create normal notification
  - Verify toast auto-dismisses after 5 seconds

### Phase 6: Monitoring & Logging

- [ ] **Feature Access Logging**
  - Access a feature-gated route
  - Check backend logs for feature access event
  - Verify audit log created in database

- [ ] **API Performance Tracking**
  - Make several API requests
  - Check backend logs for performance metrics
  - Verify slow requests (>1s) are logged as warnings

- [ ] **Error Logging**
  - Trigger an error (e.g., invalid API request)
  - Check backend logs for error details
  - Verify error metric logged

- [ ] **System Metrics**
  - Navigate to Admin Console
  - Check RealTimeMonitor component
  - Verify metrics display (even if zeros for new install)

### Phase 7: Feature Flags

- [ ] **Check Default Flags**
  - Backend console should show: "[FeatureFlags] Initialized 12 feature flags"
  - Verify flags F1-F10 are enabled by default
  - Verify F11-F12 are disabled (not implemented)

- [ ] **Percentage Rollout**
  - Test with different user IDs
  - Verify consistent results (same user always gets same result)
  - Test F7 (AI Generation) at 80% rollout

- [ ] **Role-Based Targeting**
  - Verify F4 only available to creators/admins
  - Verify F6 only available to admins
  - Test with different user roles

- [ ] **Environment Control**
  - Change NODE_ENV
  - Verify feature availability changes accordingly

---

## 🔍 Database Verification

### Check Seed Data

```bash
npx prisma studio
```

Verify tables contain data:
- **FeatureConfig**: 12 records (F1-F12)
- **FeatureUnlock**: Multiple records for test users
- **User**: At least 1 admin user
- **Notification**: Sample notifications
- **TutorialProgress**: Sample tutorial data

### Check Data Integrity

```sql
-- Check feature unlocks
SELECT u.email, fu.featureId, f.name
FROM FeatureUnlock fu
JOIN User u ON fu.userId = u.id
JOIN FeatureConfig f ON fu.featureId = f.id;

-- Check notifications
SELECT n.title, n.type, n.priority, n.read, u.email
FROM Notification n
JOIN User u ON n.userId = u.id;

-- Check audit logs
SELECT action, targetType, targetId, userId
FROM AdminAuditLog
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Re-seed
npm run db:seed
```

### Issue: WebSocket not connecting

**Symptoms**: No real-time notifications, WS connection failed in DevTools

**Solution**:
1. Check CORS settings in `apps/api/src/websocket/index.ts`
2. Verify frontend WebSocket URL in `.env`
3. Check JWT token is valid
4. Restart both servers

### Issue: JWT token expired

**Symptoms**: 401 errors, automatic logout

**Solution**:
1. Tokens expire after 15 minutes (access) / 7 days (refresh)
2. Login again to get new tokens
3. Check token refresh mechanism working
4. Verify JWT secrets match in backend `.env`

### Issue: Feature gates not working

**Symptoms**: Can access routes without unlocks

**Solution**:
1. Check feature unlocks loaded in JWT payload
2. Verify `featureGate` meta on routes
3. Check router guards executing
4. Verify features store loading unlocks

### Issue: Components not rendering

**Symptoms**: Blank pages, console errors

**Solution**:
1. Check browser console for errors
2. Verify all stores imported correctly
3. Check Element Plus installed: `npm list element-plus`
4. Verify Pinia installed: `npm list pinia`

---

## 📊 Performance Benchmarks

### Expected Response Times (Development)

| Endpoint | Expected | Max Acceptable |
|----------|----------|----------------|
| GET /api/v1/features | <50ms | 200ms |
| POST /api/v1/features/unlock | <100ms | 300ms |
| GET /api/v1/notifications | <100ms | 300ms |
| GET /api/v1/gamification/overview | <150ms | 500ms |
| WebSocket connection | <1s | 3s |

### Database Query Performance

- Feature unlock check: <10ms
- User authentication: <50ms
- Notification list: <100ms
- Dashboard data: <200ms

### Frontend Load Times

- Initial page load: <2s
- Dashboard render: <500ms
- Component hydration: <200ms

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] JWT secrets are secure (not default values)
- [ ] CORS origins updated for production domain
- [ ] API keys configured for AI services
- [ ] SSL certificates installed
- [ ] Database backups configured

### Build for Production

```bash
# Backend
cd apps/api
npm run build
npm run start

# Frontend
cd apps/web
npm run build
npm run preview  # Test production build locally
```

### Environment Variables (Production)

**Backend**:
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret-256-bits"
JWT_REFRESH_SECRET="another-strong-random-secret-256-bits"
CORS_ORIGIN="https://yourdomain.com"
```

**Frontend**:
```env
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=https://api.yourdomain.com
```

### Post-Deployment Verification

- [ ] Health check endpoint responds: `/api/health`
- [ ] Database connection working
- [ ] WebSocket connects successfully
- [ ] Feature gates enforcing correctly
- [ ] Monitoring logging properly
- [ ] Error tracking operational

---

## 📞 Support & Next Steps

### If Everything Works ✅

**Congratulations!** Your Universal UX System is operational.

**Next Steps**:
1. Gather user feedback on all 3 dashboards
2. Monitor system metrics and logs
3. Identify performance bottlenecks
4. Request additional features or improvements

### If Issues Found 🐛

**Report Format**:
```
**Issue**: Brief description
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected**: What should happen
**Actual**: What actually happened
**Logs**: Relevant error messages
**Environment**: Browser, OS, Node version
```

### Implementation Status

- ✅ **79.5% Complete** (70/88 tasks)
- ✅ All core functionality implemented
- ✅ Full integration complete
- ⏳ Testing phase pending
- ⏳ Documentation pending
- ⏳ Optimization pending

**Total Code**: ~19,666 lines across 68 files

---

## 📝 Test Results Template

After testing, record your results:

```markdown
# Test Results - Universal UX System

**Date**: _____
**Tester**: _____
**Environment**: Development / Staging / Production

## Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

## Detailed Results

### Authentication & Access
- [ ] Register: PASS / FAIL
- [ ] Login: PASS / FAIL
- [ ] Session: PASS / FAIL
- Notes: _____

### Feature Gating
- [ ] Initial Unlocks: PASS / FAIL
- [ ] Unlock Feature: PASS / FAIL
- [ ] Route Protection: PASS / FAIL
- Notes: _____

### Creator Studio
- [ ] Access Control: PASS / FAIL
- [ ] Components Load: PASS / FAIL
- [ ] AI Generation: PASS / FAIL
- Notes: _____

### Gamification Dashboard
- [ ] Access Control: PASS / FAIL
- [ ] Components Load: PASS / FAIL
- [ ] Data Display: PASS / FAIL
- Notes: _____

### Admin Console
- [ ] Access Control: PASS / FAIL
- [ ] Components Load: PASS / FAIL
- [ ] Monitoring Works: PASS / FAIL
- Notes: _____

### Notifications
- [ ] REST API: PASS / FAIL
- [ ] WebSocket: PASS / FAIL
- [ ] Toasts: PASS / FAIL
- Notes: _____

## Issues Found

1. **Issue #1**
   - Description: _____
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce: _____

## Recommendations

_____
```

---

**END OF DEPLOYMENT & TESTING GUIDE**

For questions or issues, refer to the main README.md or contact the development team.
