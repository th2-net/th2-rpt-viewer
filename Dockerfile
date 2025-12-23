FROM node:14.21-alpine AS build
ARG app_version=0.0.0
RUN apk update \
    && apk add --no-cache make build-base python3
WORKDIR /home/node
COPY ./ .
RUN npm ci && npm run build

FROM nginx:1.23.3-alpine
COPY --from=build /home/node/build/out /usr/share/nginx/html
COPY ./metrics/metrics /usr/share/nginx/html/metrics
COPY ./metrics/metrics.conf /etc/nginx/conf.d/metrics.conf
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx
RUN sed -i 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/html/config/th2
RUN ln -s /var/th2/config/custom.json /usr/share/nginx/html/config/th2/custom.json
EXPOSE 8080
RUN sed -i 's/^user/#user/' /etc/nginx/nginx.conf
