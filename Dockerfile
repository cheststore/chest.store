# Base image
FROM node:14.0.0

MAINTAINER Lance Whatley

# specify working directory
WORKDIR /usr/chest.store

# Install dependencies
COPY package.json .

RUN npm install

# Copy the remainder of the source code and build
COPY . .
RUN npm run migrate
RUN npm run postinstall

# Default command
CMD ["npm", "start"]