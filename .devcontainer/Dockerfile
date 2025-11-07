# Lightweight Node.js base image
FROM node:22-alpine

# Install basic utilities and database clients
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    nano \
    mongodb-tools \
    redis \
    && rm -rf /var/cache/apk/*

# Install global npm packages for development
RUN npm install -g \
    nodemon \
    tsx

# Create non-root user for better security
RUN addgroup -g 1001 bd2 \
    && adduser -D -u 1001 -G bd2 bd2

# Set working directory and ownership
WORKDIR /workspace
RUN chown -R bd2:bd2 /workspace

# Add /usr/local/bin to PATH for all users
ENV PATH="/usr/local/bin:${PATH}"

# Switch to non-root user
USER bd2

VOLUME ["/workspace"]

# Export some default ports just in case (maybe for a web interface)
EXPOSE 80
EXPOSE 8080

# Default command
CMD ["/bin/bash"]
