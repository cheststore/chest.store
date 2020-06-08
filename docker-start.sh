#!/bin/bash

git config --global user.name chest.store
git config --global user.email support@chest.store

npm run migrate

if "$NODE_ENV" == "production"; then
  npm start
else
  npm run startDev
fi