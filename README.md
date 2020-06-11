# chest.store

Open-source, lightweight, and hackable single pane of glass cloud file/object explorer
and git HTTP server. Integrations to several cloud providers
are available with more being added (please open an issue if your provider
of choice is not available yet). Object versioning happens
with git version control and any version history repo can
easily be cloned and/or `git pull`ed to see complete object history.

## git server

chest.store has a built in git HTTP server that is used for object version history.
Version histories are stored in a new `.chest.store` directory at the root of the
buckets/directories you integrate with.

As a bonus, the git server can be used like any other git remote
(think github, gitlab, etc.) to clone, push, pull, etc. with any
repository that uses git for its version control. Simply
[setup a remote](https://github.com/cheststore/chest.store#git-remote-example)
in your repository(ies) of choice to your chest.store server and push/pull
as desired.

When interacting with chest.store as a traditional git remote you will be
prompted to authenticate, which you'll enter your chest.store
username and password via the CLI.

### git remote example

```sh
$ git clone https://github.com/antirez/redis
$ cd redis
$ # `https://app.chest.store` below can be replaced with your server
$ git remote add chest https://app.chest.store/git/$YOUR_USERNAME/redis
$ git push chest master
$ # when prompted, enter your chest.store username and password to authenticate
```

## Install

### Docker Compose

1. Make sure [Docker and Docker Compose](https://docs.docker.com/engine/install) are installed
2. Clone chest.store (`git clone https://github.com/cheststore/chest.store`)
3. `cd chest.store`
4. `touch .env` and setup appropriate [Environment Variables](#Environment-Variables)
5. `docker-compose up`
6. Open the app in a browser (i.e. `http://localhost:8000`)
7. Optional: If you're doing front-end dev and want to run the hot reloading webpack dev server:
   - 7.1. In new terminal window/tab `cd [chest.store/]client`
   - 6.2. `npm install`
   - 6.3. `npm run dev`

### Heroku

1. Clone chest.store (`git clone https://github.com/cheststore/chest.store`)
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
3. Create a new app in the heroku console and add a new remote for the app
   - `git remote add heroku $HEROKU_GIT_URL`
4. Add Heroku Postgres and Redis Cloud add-ons to the app (in Heroku console or via CLI). This is optional because the `heroky.yml` manifest also creates these
   - Populate the `DATABASE_URL` and `REDIS_URL` [Environment Variables](#Environment-Variables) in the heroku app with the URLs provided by the add-ons
5. [Deploy the app to heroku](https://devcenter.heroku.com/articles/container-registry-and-runtime#building-and-pushing-image-s)
   - `heroku container:push web`
   - `heroku container:push --recursive` (all non-web Dockerfile.\*'s)
   - `heroku container:release web worker scheduler`

### macOS

1. Add entry to `/etc/hosts` to point to localhost for dev URL
   - `127.0.0.1 dev.chest.store`
2. Install [Homebrew](https://brew.sh/)
3. Make sure `git` is installed (`git version`), and if not install it
   - `brew install git`
4. Install NodeJS via [nvm](https://github.com/nvm-sh/nvm)
   - `nvm install 14.3.0`
   - `nvm alias default 14.3.0`
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

### Environment Variables

Create a file named `.env` in the root directory of the repo and insert
the following variables to be used whenever the server is running. Change
any respective fields to match your environment or server configuration.

```sh
# connection strings aren't needed if using
# docker-compose to deploy/run the app
DATABASE_TEST_URL=postgres://localhost:5432/cheststore_test
DATABASE_URL=postgres://localhost:5432/cheststore

# only needed if you would like to integrate with Dropbox as
# a storage provider. See Dropbox provider support above
# for more information.
DROPBOX_APP_ID=
DROPBOX_APP_SECRET=

# 'http(s)://[IP/DNS]:port' of the chest.store server
#
# if you don't use localhost or an IP address,
# make sure you have DNS setup appropriately or
# create an /etc/hosts entry for the URL of your choice
# for the server.
HOSTNAME=http://dev.chest.store:8000

# can be `error` in prod or `debug` when developing to make more verbose
LOGGING_LEVEL=info

# MASTER_KEY can be anything you want, but make long and hard to guess (i.e. a UUID)
# this is used to authenticate the local git client
# to the server in order to create new versions of files
# without needing the owning user's chest.store credentials.
MASTER_KEY=[ANY ALPHANUMERIC IDENTIFIER, PROBABLY A UUID]

NODE_ENV=development
PORT=8000

# redis connection string not needed if using docker-compose
REDIS_URL=redis://localhost:6379

# SESSION_SECRET can be anything you want, but make long and hard to guess (i.e. a UUID)
# used to sign the session ID cookie in express-session
# for more details see: https://www.npmjs.com/package/express-session#secret
SESSION_SECRET=[ANY SECRET VALUE]
```

## Cloud Storage Support (see [TODOS](#TODOS) for future possible integrations)

#### Amazon Web Services (AWS) S3

AWS S3 buckets can be integrated with a valid AWS access key and secret.
For the best experience you will want AWS S3 full access IAM permissions to the
bucket(s) you would like to integrate with chest.store. Without write access,
chest.store can't save version histories when objects are updated either through
the UI or by pushing updates through git.

<!-- ![AWS S3 Full Access](https://user-images.githubusercontent.com/13718950/82766574-37132400-9dee-11ea-9b8a-58087425c9a4.png) -->

#### Google Cloud Storage (GCS)

In order to integrate with GCS buckets(s) you'll need to create a service account
with appropriate read/write GCS permissions and download the JSON containing the
key information about the service account. This JSON file will be uploaded to
chest.store adding GCS as a provider.

#### Dropbox

Dropbox requires you to authenticate users (or yourself) via
[OAuth 2.0](https://www.dropbox.com/developers/reference/oauth-guide).
You will need to create a new app in the [developer portal](https://www.dropbox.com/developers/apps),
configure it and the callback URL to be `$HOSTNAME/auth/dropbox/callback` where `$HOSTNAME` is the
[HOSTNAME environment variable](#Environment-Variables) you have setup,
update the `DROPBOX_APP_ID` and `DROPBOX_APP_SECRET` environment variables in your .env
from this new app, and restart your chest.store server. At this point, Dropbox
should be available to use as a provider in your chest.store instance.

#### Local File System

You can integrate a directory on your (or a docker container's)
local file system to use as a "bucket" to manage files/objects
from within chest.store.

## Development

### Create PostgreSQL table/model

If you're contributing and/or doing development and need
to create a new database table, you can use the following
NPM script to create the minimum migration and model files
required to create and use the new table.

`$ npm run model -- your_new_table_name`

## TODOS

- More provider integrations
  - MS OneDrive
  - Wasabi
  - MinIO
  - DigitalOcean
  - more?
- Hooks
  - webhook integration when objects are downloaded, uploaded, synced, new version, etc.
  - custom extensions on download, upload, etc.
- Mobile app(s)
- Premium features
  - chest.store subscription service (would anyone pay for a cloud offering of this?)
  - Object editing in-app (google or O365 integrations?)
  - slackbot integration
  - Collaboration tools
    - Notes/comments, scheduling?
  - Better git repo management (github-like features)
  - Teams/enterprise(y) features
  - Blockchain integration
    - Store SHA256 bit hash of file contents in blockchain txns for tamper-proofing
    - Could be used by/for legal services or compliance auditors for proof object(s) haven't changed/been tampered with
