FROM gradle:6.6-jdk11 AS build
ARG app_version=0.0.0
RUN apt-get update \
    && apt-get install --yes --no-install-recommends make build-essential
COPY ./ .
RUN gradle dockerPrepare -Prelease_version=${app_version} -Pdownload_node

FROM nginx:1.17.10-alpine
ENV NGINX_PORT=8080
COPY --from=build /home/gradle/build/out /usr/share/nginx/html
