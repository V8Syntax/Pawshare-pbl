# PawPath – adoption & foster platform (MERN)

Shelters and caregivers list animals; adopters search, get matched by lifestyle and location, apply, message, and complete post-adoption check-ins.

## Run locally
Requires Node 18+ and MongoDB (local or Atlas).

```bash
# API
cd server
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed              # optional demo data
npm run dev               # http://localhost:5000

# Client (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Demo logins after seeding (password `password123`): `adopter@`, `shelter@`, `caregiver@`, `admin@pawpath.dev`.

## Structure
```
server/
  server.js  db.js  seed.js
  models/       User Animal Application Conversation Message CheckIn Review Notification
  controllers/  auth animal application message checkin provider notification
  routes/       one router per controller
  middleware/   auth (JWT + roles), upload (multer), error
  utils/        geo, match (lifestyle scoring), checkins (schedule), notify, token
  jobs/         reminders (daily cron for check-in reminders)
client/src/
  api.js  context/AuthContext.jsx  App.jsx  styles.css
  components/   Navbar AnimalCard FilterBar MapView ApplicationForm StatusBadge Stars ProtectedRoute
  pages/        Browse MapPage AnimalDetail AnimalForm Dashboard Messages ProviderProfile Profile Login Register
```

## How the features work
- **Listings**: photos (stored in `server/uploads`), health flags plus dated health records, temperament tags.
- **Search**: species, breed, size, age band, adopt/foster, verified-only, and radius from your location (MongoDB `2dsphere`).
- **Matching**: `utils/match.js` scores animals 0-100 against adopter preferences (species, size, energy, kids, pets, distance).
- **Applications**: `submitted → under_review → approved → completed` (or `rejected` / `withdrawn`), with a history timeline. Approving reserves the animal; completing marks it adopted/fostered and schedules check-ins.
- **Messaging**: conversations tied to an animal; the client polls every few seconds.
- **Check-ins**: scheduled at 7/30/90 days (adopt) or 7/14/30 days (foster). A daily cron creates in-app reminders. Adopters can also log health updates, which are added to the animal's records.
- **Verification & ratings**: an admin verifies shelters/caregivers from Dashboard → Verification. Adopters can review a provider after a completed placement.
- **Map**: nearby animals and shelters on OpenStreetMap tiles (Leaflet).

## Production notes
Uploads are saved to local disk; swap `middleware/upload.js` for S3/Cloudinary when deploying. Set a strong `JWT_SECRET`, and serve `client/dist` behind the API or a CDN.
