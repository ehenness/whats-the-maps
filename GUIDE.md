# GUIDE

This document explains how the repository is laid out, what each folder stores, how data moves through the app, and what the important exported functions are meant to do. This document was written by AI (Codex) and edited/read through by humans.



## 1. Repository Shape
Root folder:
- `README.md`
  High-level setup notes for the project.
- `package-lock.json`
  A lockfile at the repo root. The actual app package manifest lives one level deeper.
- `WhatsTheMaps/`
  The real Node/Express application.

In practice, almost all application work happens inside `WhatsTheMaps/`.



## 2. App Root: `WhatsTheMaps/`
This is the working application root. It contains:
- the Express app
- server-side business logic
- EJS views
- browser JavaScript
- SQL seed files
- JSON profile storage
- tests

Important top-level files here:
- `package.json`
  Defines the app scripts:
  - `npm start`: starts `bin/www`
  - `npm test`: runs Node's built-in test runner
  - `npm run test:coverage`: runs the same suite with coverage
  - Docker scripts for local DB/app startup
- `app.js`
  Creates and exports the Express app.
- `createApp.js`
  The main app assembly file. This is the best place to start when you want to understand the full request pipeline.
- `gameData.js`
  Central constants for quiz timing, scoring, and prompt text.
- `profileStore.js`
  Reads and writes the local JSON file that stores profile bios and chosen/uploaded profile images.
- `Dockerfile` and `docker-compose.yml`
  Local container setup for the app and MySQL.
- `LogOfChanges.txt`
  Project notes/history.



## 3. Top-Level Runtime Flow
The startup path is:
1. `bin/www`
   Creates the HTTP server and listens on a port.
2. `app.js`
   Calls `createApp()` and exports the Express instance.
3. `createApp.js`
   Configures middleware, sessions, routers, static files, the leaderboard route, and error handlers.

### `createApp.js` responsibilities
`createApp()` does the following:
- sets EJS as the view engine
- enables JSON and URL-encoded body parsing
- serves `public/` as static assets
- enables `express-session`
- copies `req.session.user` into `res.locals.user` so templates can access the signed-in user
- mounts:
  - `/` via `routes/index.routes.js`
  - `/users` via `routes/user.routes.js`
- defines `/leaderboard` inline
- adds a 404 handler
- adds a general error handler, including a custom response for oversized uploads

One architectural detail that matters for maintainers: `createApp.js` accepts injected dependencies. That makes routing behavior easier to test without a live database.



## 4. Main Folders Inside `WhatsTheMaps/`
### `bin/`
- `www`
  Standard Express-style server bootstrap script. Handles port normalization and common listen errors like `EADDRINUSE`.

### `config/`
Configuration and limits that are not request-specific.

- `profileConfig.js`
  Stores:
  - `maxBioLength`
  - `maxUploadedImageLength`
  - avatar image directory rules
  - `listPresetProfileImages()`, which scans `public/images/avatars`

### `controllers/`
Controllers are thin request/response handlers. They should not do heavy data shaping themselves. They usually:
- read params/query/body/session
- call a service
- render a view or return JSON
- map errors to HTTP responses

Files:
- `page.controller.js`
  - `getHomePage(req, res)`: loads random city data for the landing page
  - `getSignupPage(req, res)`: renders `signup.ejs`
  - `getLoginPage(req, res)`: renders `login.ejs` with a default login view model

- `dashboard.controller.js`
  - `getDashboard(req, res)`: renders the signed-in user's dashboard or edit mode
  - `getPlayerProfile(req, res)`: renders another player's read-only profile page

- `game.controller.js`
  - `getCitiesPage(req, res)`: renders the city list page with filters
  - `getGamePage(req, res)`: renders a specific city's quiz page
  - `submitQuiz(req, res)`: scores a quiz attempt and optionally saves the score

- `user.controller.js`
  - `signup(req, res)`: creates an account, redirects to login on success
  - `login(req, res)`: authenticates, populates session user, optionally saves a guest score after login
  - `logout(req, res)`: destroys the session
  - `updateProfile(req, res)`: saves bio/profile image settings and refreshes session user data
  - `deleteAccount(req, res)`: soft-deletes the user and logs them out

- `leaderboard.controller.js`
  Contains `getLeaderboardPage(req, res)`, but the live app currently does not use this controller. The real `/leaderboard` route is defined inline in `createApp.js`.

### `routes/`
Routers define URL patterns and attach middleware/controllers.

- `index.routes.js`
  Main site routes:
  - `/`
  - `/signup`
  - `/login`
  - `/dashboard`
  - `/players/:userId`
  - `/cities`
  - `/cities/:cityId/game`
  - `/cities/:cityId/game/submit`
  This file also contains `createInjectedSubmitQuizHandler(...)`, a test-friendly alternate submit handler that can be built from injected dependencies.

- `user.routes.js`
  User/account routes under `/users`:
  - `POST /signup`
  - `POST /login`
  - `GET /logout`
  - `POST /update-profile`
  - `POST /delete-account`
  This file also includes two injected handlers:
  - `createInjectedLoginHandler(...)`
  - `createInjectedUpdateProfileHandler(...)`
  Those exist mainly to make route behavior testable without going through the full service/repository layer.

### `services/`
Services contain application/business logic. They sit between controllers and repositories/utilities.

- `game.service.js`
  The main quiz service layer.
  Key functions:
  - `getCitiesData(query)`: returns city cards, a random city, available states, and selected filters
  - `getQuiz(cityId)`: builds a city quiz and strips server-only answer keys before sending it to the browser
  - `submitQuiz(cityId, responses, user)`: calculates score and saves it if a user is logged in
  - `getHomeData()`: returns a random city for the home page
  - `getStates()`: returns distinct states from the cities table
  - `getCities({ state, sort })`: loads city rows and facts, then enriches/sorts them
  - `getRandomCity()`: picks a random city from the DB result set
  - `buildQuizForCity(cityId)`: builds the raw quiz structure from city/fact data
  - `calculateQuizResult(cityId, responses)`: convenience wrapper that builds the quiz and scores it

- `dashboard.service.js`
  Builds dashboard/profile data.
  Key functions:
  - `getDashboardProfile(userId)`: combines DB user data, JSON-stored profile metadata, and score statistics
  - internal `getDashboardStats(userId)`: computes quizzes played, total points, best score, average score, and best leaderboard rank

- `user.service.js`
  Account and profile logic.
  Key functions:
  - `signup(username, email, password)`: hashes the password and inserts the user
  - `login(email, password)`: looks up by email, then by username if needed; validates password; returns user plus stored profile data
  - `deleteAccount(userId, password)`: verifies password, soft-deletes user row, deletes profile JSON entry
  - `updateProfile(user, body)`: sanitizes bio/image inputs, writes profile JSON, rebuilds the session-safe user object

- `leaderboard.service.js`
  Loads two leaderboard datasets in parallel:
  - best single score
  - all-time cumulative points

- `profile.service.js`
  This file currently appears incomplete and unused. It references `body` and `user` without defining them and is not part of the active request flow.

### `repositories/`
Repositories are the DB access layer. They should know SQL, but not view logic.

- `db.js`
  Creates the shared MySQL connection.
  Important behavior:
  - in normal runtime, it connects to MySQL using `DB_*` environment variables
  - in test mode, it returns a stub connection that rejects real DB access

- `game.repository.js`
  - `getCityRows()`: loads `cities` rows and normalizes IDs/states
  - `getAllFacts()`: loads joined city/fact/fact-type data and normalizes it into displayable facts

- `score.repository.js`
  - `getUserStats(userId)`: aggregate stats for a single user
  - `getScoreHistory()`: chronological score history used to compute highest leaderboard rank over time
  - `saveScore(userId, score)`: inserts a score row

- `user.repository.js`
  - `getUserByUsername(username)`
  - `getUserByEmail(email)`
  - `getUserById(userId)`
  - `createUser(username, email, passwordHash)`
  - `deleteUser(userId)`: soft-delete by setting `is_deleted = TRUE`

### `lib/`
Small shared library helpers.

- `runQuery.js`
  Wraps the callback-based MySQL client in a Promise so services/repositories can use `async`/`await`.

- `quizUtils.js`
  A pure quiz helper module with formatting/scoring helpers. It overlaps heavily with `utils/game.util.js`.
  Important maintainer note:
  - runtime code currently imports `utils/game.util.js`
  - `lib/quizUtils.js` is still tested, but appears to be an older or alternate helper implementation rather than the main runtime one

### `middleware/`

- `auth.middleware.js`
  - `redirectToLogin(req, res, next)`: for page routes that should redirect guests
  - `requireSessionUser(req, res, next)`: for actions that should return `401` instead of redirecting

### `utils/`
Pure helpers that do not directly hit the DB or depend on Express request objects.

- `game.util.js`
  The largest utility module in the app. It contains the core quiz-building and quiz-scoring logic.
  Major responsibilities:
  - fact formatting
  - question text generation
  - score splitting across questions
  - response time clamping
  - city description/info building
  - distractor selection
  - per-question score calculation
  - aggregate quiz scoring
  - city enrichment/sorting
  - quiz construction from raw cities/facts

  Exported functions include:
  - `formatFactValue`
  - `buildQuestionText`
  - `splitScorePool`
  - `clampResponseTime`
  - `normalizeNumber`
  - `formatNumber`
  - `buildCityDescription`
  - `getFactLabel`
  - `buildCityInfo`
  - `normalizeFactRows`
  - `buildQuestionForFact`
  - `calculateQuestionScore`
  - `evaluateQuestion`
  - `aggregateResults`
  - `groupFactsByCityId`
  - `enrichCities`
  - `sortCities`
  - `toClientQuiz`
  - `buildQuizFromData`
  - `calculateQuizResultFromQuiz`
  - `processCities`
  - `getCityById`
  - `getQuestionsForCity`

- `dashboard.util.js`
  - `calculateHighestLeaderboardRank(userId, scoreHistory)`
    Replays score history to determine the best rank a player ever reached.

- `profile.util.js`
  - `trimString(value)`: normalizes string inputs
  - `getProfileImage(...)`: validates uploaded image data or preset avatar choice and returns the resolved image URL

- `session.util.js`
  - `buildSessionUser(user, storedProfile)`
    Produces the smaller session-safe user object used by templates and session storage.

### `viewModels/`
Small helpers that build template-friendly objects.

- `authViewModels.js`
  - `buildLoginViewModel({ errorMessage, email })`

- `dashboard.viewModel.js`
  - `buildReadOnlyDashboardViewModel(data)`
    Converts dashboard data into a read-only profile page state.

### `views/`
Server-rendered EJS templates.

Pages:
- `home.ejs`
  Landing page with random quiz CTA and login/logout controls.
- `cities.ejs`
  City browser with state filters and quiz launch buttons.
- `game.ejs`
  Quiz page shell. Embeds JSON data for the client-side quiz app.
- `dashboard.ejs`
  Handles both normal dashboard view and edit-profile mode.
- `leaderboard.ejs`
  Leaderboard display.
- `login.ejs`
  Login form.
- `signup.ejs`
  Signup form.
- `error.ejs`
  Generic error page.

Shared partials:
- `views/partials/banner.ejs`
- `views/partials/footer.ejs`

### `public/`
Static browser assets.

- `public/javascript/cityGame.js`
  Client-side quiz runtime.
  Responsibilities:
  - reads server-rendered JSON from the page
  - runs the question timer
  - records answers and response times
  - submits the full response list to `/cities/:cityId/game/submit`
  - renders the result summary returned by the server

- `public/javascript/dashboard.js`
  Client-side avatar picker logic.
  Responsibilities:
  - previews uploaded images
  - converts uploads to data URLs
  - clears uploads when preset avatars are selected
  - clears preset selection when a custom upload is chosen

- `public/stylesheets/style.css`
  Main app stylesheet.

- `public/images/avatars/`
  Preset profile avatar images discovered by `config/profileConfig.js`.

### `data/`

- `data/userProfiles.json`
  Local JSON store for user bios and profile image URLs/data URLs.
  Important distinction:
  - user accounts and scores live in MySQL
  - bios and profile images live in this JSON file

### `DB/`
SQL dump files used to initialize the MySQL database.

Files:
- `trivia_app_users.sql`
- `trivia_app_cities.sql`
- `trivia_app_fact_types.sql`
- `trivia_app_city_facts.sql`
- `trivia_app_scores.sql`

From the filenames and repository SQL, the main tables are:
- `users`
- `cities`
- `fact_types`
- `city_facts`
- `scores`

### `test/`
Automated tests organized roughly by runtime layer:

- `test/controllers/`
- `test/routes/`
- `test/services/`
- `test/repositories/`
- `test/utils/`
- `test/lib/`
- `test/middleware/`
- `test/viewModels/`
The project uses Node's built-in test runner via `node --test`, even though some older dev dependencies like `mocha` and `chai` are still present.

### `testSupport/`

- `routerTestUtils.js`
  Builds mock request/response objects and invokes router handlers directly. This is what allows route tests to run without booting a real server.

### `node_modules/`
Installed dependencies. Generated, not hand-maintained source.



## 5. Where Different Kinds of Data Live
This app stores different kinds of data in different places.

### MySQL database
Stored in MySQL:
- users
- cities
- fact types
- city facts
- scores
This is the authoritative source for quiz content and leaderboard data.

### JSON file storage
Stored in `data/userProfiles.json`:
- profile bio
- profile image URL
- uploaded profile image data URL
This is separate from the `users` table.

### Session storage
Stored in `req.session`:
- signed-in session user
- temporary `pendingGuestScore`
`pendingGuestScore` is important:
- guests can finish a quiz without logging in
- their result is kept in the session
- after login, `user.controller.js` saves that score to MySQL and clears the pending value

### Server-rendered JSON embedded in HTML
The quiz page uses EJS to embed JSON into `<script type="application/json">` tags:
- `quiz-data`
- `game-meta`
`public/javascript/cityGame.js` reads those blobs and runs the quiz in the browser.



## 6. Core Request Flows
### Home page
Flow:
1. `GET /`
2. `page.controller.getHomePage`
3. `game.service.getHomeData`
4. `game.service.getRandomCity`
5. `game.repository.getCityRows`
6. render `home.ejs`

### City browser
Flow:
1. `GET /cities`
2. `game.controller.getCitiesPage`
3. `game.service.getCitiesData`
4. `game.service.getCities`, `getRandomCity`, `getStates`
5. `game.repository.getCityRows`, `game.repository.getAllFacts`
6. `game.util.processCities`
7. render `cities.ejs`

### Quiz page
Flow:
1. `GET /cities/:cityId/game`
2. `game.controller.getGamePage`
3. `game.service.getQuiz`
4. `game.service.buildQuizForCity`
5. `game.repository.getCityRows`, `game.repository.getAllFacts`
6. `game.util.buildQuizFromData`
7. `game.util.toClientQuiz`
8. render `game.ejs`

### Quiz submission
Flow:
1. browser script posts to `/cities/:cityId/game/submit`
2. `game.controller.submitQuiz`
3. `game.service.submitQuiz`
4. `game.service.buildQuizForCity`
5. `game.util.calculateQuizResultFromQuiz`
6. if logged in:
   score saved through `score.repository.saveScore`
7. if guest:
   result stored on `req.session.pendingGuestScore`
8. JSON result returned to browser

### Login with guest-score handoff
Flow:
1. guest finishes quiz
2. session stores `pendingGuestScore`
3. user logs in through `user.controller.login`
4. session user is built with `buildSessionUser`
5. if `pendingGuestScore` exists:
   - `score.repository.saveScore` persists it
   - session value is deleted
   - user is redirected to `/dashboard?scoreSaved=1`

### Dashboard/profile
Flow:
1. `GET /dashboard`
2. `auth.middleware.redirectToLogin`
3. `dashboard.controller.getDashboard`
4. `dashboard.service.getDashboardProfile`
5. data is composed from:
   - `user.repository.getUserById`
   - `profileStore.getStoredProfile`
   - `score.repository.getUserStats`
   - `score.repository.getScoreHistory`
   - `dashboard.util.calculateHighestLeaderboardRank`
6. render `dashboard.ejs`

### Profile update
Flow:
1. `POST /users/update-profile`
2. auth middleware ensures a session user exists
3. `user.controller.updateProfile`
4. `user.service.updateProfile`
5. `profile.util.getProfileImage` validates avatar/upload choice
6. `profileStore.saveStoredProfile` writes JSON
7. `session.util.buildSessionUser` refreshes session user
8. redirect back to dashboard with success/error query flags



## 7. Important Architectural Notes
### The app mixes DB-backed and file-backed user data

This is the single most important structural quirk to know:
- auth/account rows are in MySQL
- bios/profile images are in `data/userProfiles.json`
If a maintainer changes user-related behavior, they need to check both storage paths.

### Some files are clearly active runtime code, some are not
Active runtime paths include:
- `createApp.js`
- `routes/`
- `controllers/`
- `services/`
- `repositories/`
- `utils/game.util.js`

Files that look secondary or currently unused:
- `controllers/leaderboard.controller.js`
  Exists, but route is currently inline elsewhere.
- `services/profile.service.js`
  Appears incomplete and unused.
- `lib/quizUtils.js`
  Tested, but runtime logic mainly uses `utils/game.util.js`.

### Testability was designed into the routers/app assembly
This project uses dependency injection in a few places:
- `createApp(...)`
- `createIndexRouter(...)`
- `createUsersRouter(...)`
That makes it easier to test route behavior in isolation.




## 8. Good Starting Points For Future Maintainers
If you need to change:
- app boot or middleware order:
  start with `createApp.js`
- page URLs:
  start with `routes/`
- HTTP behavior:
  check the matching controller
- business rules:
  check the matching service
- SQL or DB shape:
  check `repositories/` and `DB/`
- quiz generation/scoring:
  start with `utils/game.util.js`
- dashboard stats/rank logic:
  start with `services/dashboard.service.js` and `utils/dashboard.util.js`
- profile image/bio behavior:
  check `user.service.js`, `profile.util.js`, `profileStore.js`, and `config/profileConfig.js`
- browser quiz behavior:
  check `public/javascript/cityGame.js`



## 9. Suggested Mental Model
The cleanest way to think about this app is:
- `routes/` decide which code runs for a URL
- `controllers/` translate HTTP into app actions
- `services/` decide what should happen
- `repositories/` talk to MySQL
- `utils/` and `viewModels/` shape data
- `views/` render HTML
- `public/javascript/` adds browser-side behavior after the page loads
- `profileStore.js` is a special side store for profile metadata

If you keep that model in mind, the codebase is much easier to navigate.