FROM node:18.13.0

ARG project_path
COPY ./package*.json /home/node/Karassistant_sentenseEncoder/
WORKDIR /home/node/Karassistant_sentenseEncoder/
RUN npm install --omit=dev
RUN npm install @tensorflow/tfjs-node
COPY . /home/node/Karassistant_sentenseEncoder/

ENTRYPOINT ["npm", "run"]
CMD ["start"]