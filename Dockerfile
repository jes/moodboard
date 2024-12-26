# Use Node.js LTS (Long Term Support) image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create uploads and data directories
RUN mkdir -p uploads data

# Expose the port the app runs on
EXPOSE 10303

# Command to run the app
CMD ["npm", "start"]