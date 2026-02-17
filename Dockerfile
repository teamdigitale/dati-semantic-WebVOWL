FROM node:20-alpine AS builder_fe
WORKDIR /
COPY webVowl ./
RUN npm install
RUN npm run build

FROM eclipse-temurin:21-jdk-jammy AS builder_be
WORKDIR /app
COPY ./owl2vowl /app
COPY --from=builder_fe ./deploy ../webVowl/deploy
RUN ./gradlew --no-daemon clean build

FROM eclipse-temurin:21-jre-jammy
USER 1001
COPY --from=builder_be /app/build/libs/owl2vowl.war /owl2vowl.war
CMD ["java", "--add-opens", "java.base/java.lang=ALL-UNNAMED", "-jar", "/owl2vowl.war"]
