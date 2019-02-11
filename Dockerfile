FROM node:10

RUN mkdir -p /app/src /app/tmp/build
WORKDIR /app

#Install NPM packages.
ADD package.json package-lock.json /app/
RUN bash -c "NODE_ENV=development npm install"

#Add source files.
ADD . /app

#Build the app, and run the server.
CMD bash -c "npm run front-end:build && npm run back-end:start"
