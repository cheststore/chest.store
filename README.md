# chest.store

Open-source, easy, lightweight, and hackable cloud object explorer,
storage, and git HTTP server. Object versioning happens
with git version control via new commits per uploaded version of a file.

## Built-in git server

chest.store has a built in HTTP git server and can be used
like any other git remote to clone, push, pull, etc. any repository that uses git
for its version control. Therefore, you can simply setup a new remote
in your repository(ies) of choice to your chest.store server and
push/pull as desired.

```sh
# `https://chest.store` can be replaced with your server info
$ git remote add chest https://chest.store/git/YOUR_USERNAME/REPO_NAME
$ git push chest master
```

## Install

### Docker

1. Clone chest.store (`git clone https://github.com/cheststore/chest.store`)
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
7. Clone chest.store (`git clone https://github.com/cheststore/chest.store`)
8. `cd chest.store`
9. `touch .env` and setup appropriate [Environment Variables](#Environment-Variables)
10. `npm install`
11. `npm run migrate`
12. `npm run dev`
13. In new terminal window/tab `cd [chest.store/]client`
14. `npm install`
15. `npm run serve`

## Development

### Environment Variables

Create a file named `.env` in the root directory of the repo and insert
the following variables to be used whenever the dev server is running. Change
any respective fields to match your local or server configuration:

```sh
# connection strings aren't needed if using
# docker-compose to deploy/run the app
DATABASE_TEST_URL=postgres://localhost:5432/cheststore_test
DATABASE_URL=postgres://localhost:5432/cheststore

# if you don't use localhost or an IP address,
# make sure you have DNS setup appropriately or
# create an /etc/hosts entry for the URL of your choice
# for the server.
HOSTNAME=http://dev.chest.store:8000

LOGGING_LEVEL=info

# MASTER_KEY is used to authenticate the local git client
# to the server in order to create new versions of files
# without needing the owning user's chest.store credentials.
MASTER_KEY=[ANY ALPHANUMERIC IDENTIFIER, PROBABLY A UUID]

NODE_ENV=development
PORT=8000

# redis connection string not needed if using docker-compose
REDIS_URL=redis://localhost:6379

# used to sign the session ID cookie in express-session
# for more details see: https://www.npmjs.com/package/express-session#secret
SESSION_SECRET=[ANY SECRET VALUE]
```

### Create PostgreSQL table/model

If you need to create a new database table, you can use the
following NPM script to create the minimum migration and
model files required to create and use the new table.

`$ npm run model -- your_new_table_name`
