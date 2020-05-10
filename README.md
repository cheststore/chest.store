# chest.store

### Install

#### Manual (macOS)

1. Add entry to `/etc/hosts` to point to localhost for dev URL
    - `127.0.0.1       dev.chest.store`
2. Install [Homebrew](https://brew.sh/)
3. Install NodeJS via [nvm](https://github.com/nvm-sh/nvm)
    - `nvm install 14.0.0`
    - `nvm alias default 14.0.0`
4. Install PostgreSQL via [Postgres.app](https://postgresapp.com/)
    - Create DBs in `psql` or your client of choice
    - `CREATE DATABASE cheststore`
    - `CREATE DATABASE cheststore_test`
5. Install redis (`brew install redis`)
    - `brew services list` to make sure redis service is started without issues
6. Clone chest.store (`git clone https://github.com/whatl3y/chest.store`)
7. `cd chest.store`
8. `touch .env` and setup appropriate [Environment Variables](#Environment-Variables)
9. `npm install`
9. `npm run migrate`
10. `npm run dev`
11. In new terminal window/tab `cd [chest.store/]client`
12. `npm install`
13. `npm run serve`