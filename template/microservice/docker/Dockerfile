FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
USER node
CMD ["npm","run","dev"]
