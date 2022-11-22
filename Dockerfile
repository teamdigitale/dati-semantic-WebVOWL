FROM node:fermium-alpine3.16 as builde_fe
WORKDIR /
COPY webVowl ./
RUN npm install
RUN npm run build


FROM openjdk:11-jdk-slim as builder_be
WORKDIR /app
COPY ./owl2vowl /app
COPY --from=builde_fe ./deploy ../webVowl/deploy
RUN ./gradlew clean build 

FROM tomcat:9.0.48-jdk11-openjdk-slim
RUN rm -rf /usr/local/tomcat/webapps/*
COPY --from=builder_be /app/build/libs/owl2vowl*.war /usr/local/tomcat/webapps/ROOT.war
CMD ["catalina.sh", "run"]