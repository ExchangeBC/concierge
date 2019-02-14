FROM node:10

#Set up the directory that will store the source code.
RUN mkdir /app
WORKDIR /app

#Install NPM packages.
#We want to cache the image at the node module installation for faster rebuilds.
ADD package.json package-lock.json /app/
RUN bash -c "NODE_ENV=development npm install"

#Add source files.
ADD . /app

#Build the front-end.
RUN bash -c "npm run front-end:build"

#Start the server.
CMD bash -c "npm run back-end:start"
