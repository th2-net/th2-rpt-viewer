FROM gradle:6.6-jdk11 AS build
ARG app_version=0.0.0
COPY ./ .
RUN gradle buildProd

FROM nginx:1.17.10-alpine
ENV NGINX_PORT=8080
COPY ./build/out /usr/share/nginx/html
