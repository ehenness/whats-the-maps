# What's The Maps?

What's The Maps? is an Express + EJS trivia game backed by MySQL. The recommended local setup uses Docker Compose so the app and database start together with the seeded data in the `DB/` folder.

## Quick Start
Project setup:

1. Open the WhatsTheMaps folder
2. Run: npm install
3. Run: npm run docker:up
4. Open: http://localhost:3000

If you need to fully rebuild the DB from the SQL dump files:
npm run docker:reset


## Project Structure

- `app.js` configures the Express app and top-level middleware.
- `bin/www` is the main Node entry point used by `npm start`.
- `routes/` contains the page and account routes.
- `views/` contains the EJS templates.
- `public/` contains browser JavaScript, styles, and images.
- `DB/` contains the SQL dump files Docker imports into MySQL.
- `data/userProfiles.json` stores local profile bio and avatar data.

## Docker Setup

From the `WhatsTheMaps` folder, run:

```bash
npm install
npm run docker:up
```

That command:

- builds the Node app image
- starts the app container
- starts a MySQL 8 container
- imports the SQL dump files from `DB/` on first startup

To stop the stack:

```bash
npm run docker:down
```

To stream logs:

```bash
npm run docker:logs
```

To fully rebuild the database from the SQL dump files:

```bash
npm run docker:reset
```

## Fresh Clone Handoff

For a new developer starting from a fresh git clone:

```bash
git clone <repo-url>
cd whats-the-maps/WhatsTheMaps
npm install
npm run docker:up
```

Once the containers are up, open [http://localhost:3000](http://localhost:3000).

## App And Database Ports

- App: [http://localhost:3000](http://localhost:3000)
- MySQL: `localhost:3307`

The database is published on `3307` so it does not conflict with another local MySQL server that may already be using `3306`.

## Database Connection Details

The app container connects to MySQL with these defaults:

```env
DB_HOST=db
DB_PORT=3306
DB_USER=appuser
DB_PASSWORD=apppassword
DB_NAME=trivia_app
```

If you want to connect to the Docker MySQL instance from your host machine with a GUI like MySQL Workbench or TablePlus, use:

```env
HOST=127.0.0.1
PORT=3307
USER=appuser
PASSWORD=apppassword
DATABASE=trivia_app
```

## Seed Data

On first startup, Docker imports these SQL files in order:

1. `DB/trivia_app_users.sql`
2. `DB/trivia_app_cities.sql`
3. `DB/trivia_app_fact_types.sql`
4. `DB/trivia_app_city_facts.sql`
5. `DB/trivia_app_scores.sql`

These files are only applied when MySQL initializes a fresh data volume.

## Re-Import Database Data

If you change the SQL dump files and want Docker to rebuild the database from scratch, run:

```bash
docker compose down -v
docker compose up --build
```

The `-v` is important because it removes the existing MySQL volume. Without that, Docker keeps the current database contents and skips the seed SQL files.

## Environment Variables

A sample env file is included as `.env.example`. You can copy it to `.env` if you want to override defaults later.

## Non-Docker Run

If you want to run the Node app outside Docker, make sure you have:

- Node dependencies installed in `WhatsTheMaps/node_modules`
- a MySQL server running
- matching `DB_*` environment variables set for `db.js`

Then start the app with:

```bash
npm start
```
