FROM docker.io/node:14.18

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY package*.json /usr/app

RUN NODE_ENV=development npm install

COPY . /usr/app

EXPOSE 3000

RUN chmod -R 775 /usr/app

RUN npm run front-end:build

CMD ["npm", "start"]

