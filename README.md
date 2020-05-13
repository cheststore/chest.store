# chest.store

Easy and lightweight S3 object explorer, cloud storage, and git HTTP server.
Object versioning happens through git via new commits per version.

## Install

## Development

### Manual (macOS)

1. Add entry to `/etc/hosts` to point to localhost for dev URL
    - `127.0.0.1       dev.chest.store`
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