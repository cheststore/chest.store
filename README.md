# chest.store

Easy and lightweight S3 object explorer, cloud storage, and git HTTP server.
Object versioning happens through git via new commits per version.

## Install

## Development

### Docker

1. Clone chest.store (`git clone https://github.com/whatl3y/chest.store`)
2. `cd chest.store`
3. `touch .env` and setup appropriate [Environment Variables](#Environment-Variables)
4. Make sure [Docker and Docker Compose](https://docs.docker.com/get-docker/) are installed
5. `docker-compose up`
6. Optional: If you're doing front-end dev and want to run the hot reloading webpack dev server:
   - 6.1. In new terminal window/tab `cd [chest.store/]client`
   - 6.2. `npm install`
   - 6.3. `npm run serve`

### Manual (macOS)

1. Add entry to `/etc/hosts` to point to localhost for dev URL
   - `127.0.0.1 dev.chest.store`
2. Install [Homebrew](https://brew.sh/)
3. Make sure `git` is installed (`git version`), and if not install it
   - `brew install git`
4. Install NodeJS via [nvm](https://github.com/nvm-sh/nvm)
   - `nvm install 14.0.0`
   - `nvm alias default 14.0.0`
5. Install PostgreSQL via [Postgres.app](https://postgresapp.com/)
   - Create DBs in `psql` or your client of choice
   - `CREATE DATABASE cheststore`
   - `CREATE DATABASE cheststore_test`
6. Install redis
   - `brew install redis`
   - `brew services list` to make sure redis service is started without issues
7. Clone chest.store (`git clone https://github.com/whatl3y/chest.store`)
8. `cd chest.store`
9. `touch .env` and setup appropriate [Environment Variables](#Environment-Variables)
10. `npm install`
11. `npm run migrate`
12. `npm run dev`
13. In new terminal window/tab `cd [chest.store/]client`
14. `npm install`
15. `npm run serve`

##### Environment Variables

Create a file named `.env` in the root directory of the repo and insert
the following variables to be used whenever the dev server is running. Change
any respective fields to match your local information:

```sh
CRYPT_SECRET=[A VERY SECRET VALUE]
DATABASE_TEST_URL=postgres://localhost:5432/cheststore_test
DATABASE_URL=postgres://localhost:5432/cheststore
HOSTNAME=http://dev.chest.store:8080
LOGGING_LEVEL=info
MASTER_KEY=[UNIQUE KEY FOR LOCAL GIT CLIENT TO AUTH WITH GIT SERVER]
NODE_ENV=development
PORT=8000
REDIS_URL=redis://localhost:6379
SESSION_SECRET=[ANY SECRET VALUE]
```

#### Create PostgreSQL table/model

If you need to create a new database table, you can use the
following NPM script to create the minimum migration and
model files required to create and use the new table.

`$ npm run model -- your_new_table_name`
