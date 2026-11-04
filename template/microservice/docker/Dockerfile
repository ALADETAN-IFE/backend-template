FROM node:20
WORKDIR /app
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","run","dev"]
