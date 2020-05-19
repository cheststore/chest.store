# Base image
FROM node:14.0.0

LABEL AUTHOR="Lance Whatley"

# specify working directory
WORKDIR /usr/chest.store

# Install dependencies
COPY package.json .

RUN npm install

# Copy the remainder of the source code and build
COPY . .
RUN npm run postinstall

# Default command
CMD [ "sh", "docker-start.sh" ]