# POE2Stash Docker Documentation

```
# Author: Corey Deli
# GitHub: https://github.com/coreydeli
# Date: March 13, 2025
```

This document explains how to build, run, and troubleshoot the POE2Stash Docker container, which provides a containerized version of the POE2Stash application for Path of Exile 2 item management.

## Overview

The POE2Stash Docker container allows you to run the POE2Stash Electron application in a browser window without installing it directly on your system. The container uses VNC technology to display the application interface in your web browser.

## Building the Container

### Prerequisites

- Docker installed on your system
- Git to clone the repository (optional)

### Build Steps

1. Save the Dockerfile in your project directory

2. Build the Docker image:
   ```bash
   docker build -t poe2stash .
   ```

   If you're behind a corporate network or experiencing network issues:
   ```bash
   docker build --network=host -t poe2stash .
   ```

## Running the Container

### Basic Usage

Run the container with:

```bash
docker run -d --name poe2stash -p 5800:5800 -v poe2stash-data:/config poe2stash
```

This will:
- Start the container in detached mode (-d)
- Name it "poe2stash" (--name)
- Map port 5800 to your host (-p)
- Create a persistent volume for configuration data (-v)

### Accessing the Application

1. Open your web browser
2. Navigate to: http://localhost:5800
3. The POE2Stash application will appear in your browser window

### Container Management

- **Stop the container**: `docker stop poe2stash`
- **Start an existing container**: `docker start poe2stash`
- **Remove the container**: `docker rm poe2stash`
- **View logs**: `docker logs poe2stash`
- **Execute commands in container**: `docker exec -it poe2stash bash`

## Customization

### Display Resolution

You can customize the display resolution by setting environment variables:

```bash
docker run -d --name poe2stash -p 5800:5800 \
  -e DISPLAY_WIDTH=1920 -e DISPLAY_HEIGHT=1080 \
  -v poe2stash-data:/config poe2stash
```

### Persistent Data

The container uses a Docker volume (`poe2stash-data`) to store configuration. This ensures your settings persist between container restarts and updates.

## Troubleshooting

### Container Won't Start

If the container fails to start:

1. Check Docker logs:
   ```bash
   docker logs poe2stash
   ```

2. Verify port availability:
   ```bash
   netstat -tuln | grep 5800
   ```

3. Check if the container is already running:
   ```bash
   docker ps -a | grep poe2stash
   ```

### Black Screen or Application Doesn't Appear

1. Wait ~10-15 seconds for the application to fully start
2. Refresh your browser
3. Check container logs for errors:
   ```bash
   docker logs poe2stash
   ```
4. Check application logs inside the container:
   ```bash
   docker exec poe2stash cat /tmp/poe2stash-startup.log
   docker exec poe2stash cat /tmp/poe2stash-app.log
   ```

### Permission Issues

If you see permission-related errors in the logs:

1. Make sure the Docker volume is properly created:
   ```bash
   docker volume inspect poe2stash-data
   ```

2. Try recreating the container:
   ```bash
   docker rm -f poe2stash
   docker run -d --name poe2stash -p 5800:5800 -v poe2stash-data:/config poe2stash
   ```

### Network Issues During Build

If you encounter network issues while building:

1. Try using host networking:
   ```bash
   docker build --network=host -t poe2stash .
   ```

2. Check your Docker network settings:
   ```bash
   docker network ls
   ```

3. Try setting DNS explicitly:
   ```bash
   docker build --network=host --build-arg "DNS=8.8.8.8" -t poe2stash .
   ```

## Advanced Configuration

### VNC Password

To secure the VNC connection with a password:

```bash
docker run -d --name poe2stash -p 5800:5800 \
  -e VNC_PASSWORD=mypassword \
  -v poe2stash-data:/config poe2stash
```

### Custom Port

To use a different port:

```bash
docker run -d --name poe2stash -p 8080:5800 -v poe2stash-data:/config poe2stash
```

Then access the application at: http://localhost:8080

## Technical Details

The container is built using:

- Base image: jlesage/baseimage-gui:debian-11
- POE2Stash application extracted from AppImage
- noVNC for browser-based VNC access

The Electron application is run with specific flags:
- `--no-sandbox` and `--disable-gpu-sandbox` to support containerized execution

## Known Issues

- The menu bar at the top of the application cannot be hidden automatically
- Performance may vary depending on your system resources
- Some functionality might be limited compared to the native application