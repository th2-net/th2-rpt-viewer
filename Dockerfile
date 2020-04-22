FROM nginx:1.17.10-alpine
ENV NGINX_PORT=8080
COPY ./ /usr/share/nginx/html