FROM node:16

RUN apt install openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8888

CMD ["npm", "start"]
