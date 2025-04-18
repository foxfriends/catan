FROM node:22.14.0
WORKDIR /app
COPY ./package.json ./package-lock.json ./
RUN npm ci
COPY ./webpack.config.js ./
COPY ./public_html/ ./public_html/
COPY ./server.js ./game.js .
ENV NODE_ENV=production
ENV catan_port=3000
EXPOSE $catan_port
RUN npm run build
CMD ["node", "server.js"]
