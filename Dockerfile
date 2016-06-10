FROM node:6

RUN useradd --user-group --create-home --shell /bin/false service

ENV HOME=/home/service
RUN mkdir -p $HOME/api-users-read

RUN npm install pm2 -g

COPY package.json $HOME/api-users-read
RUN chown -R service:service $HOME/*

USER service
WORKDIR $HOME/api-users-read
RUN npm install

USER root
COPY . $HOME/api-users-read
RUN chown -R service:service $HOME/*
USER service

CMD ["node", "index.js"]
