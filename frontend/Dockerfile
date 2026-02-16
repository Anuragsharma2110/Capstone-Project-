# Dockerfile for Frontend

# Use Node.js LTS (Hydrogen) for stability and reproducibility
FROM node:22-alpine

# Set work directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies (clean install for CI/CD like reproducibility)
RUN npm ci

# Copy project files
COPY . .

# Expose port 5173
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host"]
