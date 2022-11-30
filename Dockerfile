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

FROM openjdk:11-jdk-slim
USER 1001
COPY --from=builder_be /app/build/libs/owl2vowl.war /owl2vowl.war
CMD ["java", "-jar", "/owl2vowl.war"]
