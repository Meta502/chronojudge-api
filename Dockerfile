FROM node:16.9.1-bullseye

WORKDIR /app/chronojudge-api

ENV PATH /app/chronojudge-api/node_modules/.bin:$PATH

COPY package.json ./

RUN yarn install

COPY . ./

# Install OpenJDK-8
RUN apt-get update && \
    apt-get install -y default-jdk && \
    apt-get clean;
    
# Fix certificate issues
RUN apt-get update && \
    apt-get install ca-certificates-java && \
    apt-get clean && \
    update-ca-certificates -f;

EXPOSE 3006

CMD yarn build && yarn start
