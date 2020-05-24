#!/bin/bash

git config --global user.name chest.store
git config --global user.email support@chest.store

npm run migrate

npm start