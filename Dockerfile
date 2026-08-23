# Author: Corey Deli
# GitHub: https://github.com/coreydeli
# Date: March 13, 2025

# All-in-One Dockerfile for POE2Stash
# This builds and runs the Electron app with GUI support

# Stage 1: Build the application
FROM node:22.14.0 AS builder

# Install necessary build dependencies
RUN apt-get update && \
    apt-get install -y \
    p7zip-full git curl xz-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the runtime environment
FROM jlesage/baseimage-gui:debian-11

# Set environment variables
ENV APP_NAME="POE2Stash" \
    DISPLAY_WIDTH=1280 \
    DISPLAY_HEIGHT=768 \
    KEEP_APP_RUNNING=1 \
    ENABLE_CJK_FONT=1 \
    TAKE_CONFIG_OWNERSHIP=1 \
    DISPLAY=:0 \
    HOME=/config \
    DEBIAN_FRONTEND=noninteractive \
    ELECTRON_NO_SANDBOX=1

# Install Electron dependencies
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libdrm2 \
    libgbm1 \
    libxcb-dri3-0 \
    libxcb-cursor0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libatk1.0-0 \
    pulseaudio \
    mesa-utils \
    x11-utils \
    x11-apps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the built app from the builder stage
COPY --from=builder /app/release /app

# Find and extract the Linux AppImage
RUN find /app -name "*.AppImage" -exec cp {} /app/POE2Stash.AppImage \; || echo "AppImage not found, continuing..." && \
    chmod +x /app/POE2Stash.AppImage 2>/dev/null || echo "Could not chmod AppImage"

# Create the startup script
COPY startapp.sh /startapp.sh
RUN chmod +x /startapp.sh

# Define a volume for persistence
VOLUME /config

# Expose the VNC web interface port
EXPOSE 5800 5900