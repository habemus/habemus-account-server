FROM node:5.0.0
MAINTAINER Simon Fan <sf@habem.us>

COPY . /application

WORKDIR /application
# bcrypt needs to be recompiled
RUN ["npm", "rebuild"]

# port must match exposed port
ENV PORT 5000

# directories that must be mounted at run
ENV MONGODB_URI_PATH   /etc/h-account/mongodb-uri
ENV RABBIT_MQ_URI_PATH /etc/h-account/rabbit-mq-uri
ENV SECRET_PATH        /etc/h-account/secret

ENTRYPOINT ["node", "/application/cli/start.js"]

EXPOSE 5000