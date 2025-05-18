FROM node:18

WORKdIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5008

CMD ["npm", "start"]