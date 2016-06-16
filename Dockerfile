FROM node:5.0.0
MAINTAINER Simon Fan <sf@habem.us>

COPY . /application

WORKDIR /application
# bcrypt needs to be recompiled
RUN ["npm", "rebuild"]

# port must match exposed port
ENV PORT 5000

# directories that must be mounted at run
ENV SENDGRID_API_KEY_PATH /etc/h-auth/sendgrid-api-key
ENV MONGODB_URI_PATH      /etc/h-auth/mongodb-uri
ENV SECRET_PATH           /etc/h-auth/secret

ENTRYPOINT ["node", "/application/cli/start.js"]

EXPOSE 5000