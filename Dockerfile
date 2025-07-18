# Use the official Node.js 14 image as the base image
FROM s001elk2.konsalt.info:5555/node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Create a directory for data
RUN mkdir -p /data

# Set the directory as writable
RUN chmod -R 777 /data

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the Node.js application
CMD ["node", "app.js"]
