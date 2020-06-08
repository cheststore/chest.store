#!/bin/bash

git config --global user.name chest.store
git config --global user.email support@chest.store

if [ "$1" = "worker" ]; then
  npm run worker
elif [ "$1" = "scheduler" ]; then
  npm run scheduler
else # web
  npm run migrate
  npm start
fi