FROM node:25-slim

# Set the working directory in the container
WORKDIR /app
RUN mkdir system && mkdir server

# Install system dependencies
COPY ./system/package*.json ./system/
COPY ./system/tsconfig.json ./system/
RUN npm --prefix system ci

# Install server dependencies
COPY ./server/package*.json ./server/
COPY ./server/tsconfig.json ./server/
RUN npm --prefix server ci

# Copy the rest of the system and server code
COPY ./system/src ./system/src
RUN npm --prefix system run build

COPY ./server/src ./server/src

# Expose the port that the application runs on
EXPOSE 8082

# Set environment variables for Cloud Run
# The PORT environment variable is used by Cloud Run to specify which port your app should listen on
ENV PORT=8082

# Start the server with npm run dev
CMD ["npm", "--prefix", "server", "run", "dev"]
