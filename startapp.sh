#!/bin/bash

# Author: Corey Deli
# GitHub: https://github.com/coreydeli
# Date: March 13, 2025

# Set environment variables
export HOME=/config
export DISPLAY=:0
export ELECTRON_NO_SANDBOX=1
export DEBUG=1

# Create sentinel file to prevent loops
SENTINEL_FILE="/tmp/poe2stash_running"

# Check if we're already running to avoid loops
if [ -f "$SENTINEL_FILE" ]; then
  echo "Another instance is already running or previous instance failed. If this is wrong, delete $SENTINEL_FILE" > /tmp/poe2stash-error.log
  exec xeyes  # Run a simple app instead of getting into a loop
else
  # Create the sentinel file
  touch "$SENTINEL_FILE"
fi

# Create a directory we can write to
mkdir -p /config/poe2stash-app

# Log startup
echo "Starting POE2Stash at $(date)" > /tmp/poe2stash-startup.log

# Check if AppImage exists
if [ -f /app/POE2Stash.AppImage ]; then
  echo "Found AppImage at /app/POE2Stash.AppImage" >> /tmp/poe2stash-startup.log
  
  # Check if we've already extracted the AppImage
  if [ ! -d /config/poe2stash-app/squashfs-root ]; then
    echo "Extracting AppImage contents to /config/poe2stash-app..." >> /tmp/poe2stash-startup.log
    
    # Navigate to a directory where we have write permissions
    cd /config/poe2stash-app
    
    # Extract the AppImage contents
    /app/POE2Stash.AppImage --appimage-extract >> /tmp/poe2stash-startup.log 2>&1
    
    # Check if extraction succeeded
    if [ ! -d /config/poe2stash-app/squashfs-root ]; then
      echo "AppImage extraction failed" >> /tmp/poe2stash-startup.log
      echo "Running fallback alternative - simple GUI" >> /tmp/poe2stash-startup.log
      rm -f "$SENTINEL_FILE"  # Remove sentinel file
      exec xeyes  # Fall back to simple GUI app
    fi
  fi
  
  # Found the extracted directory, looking for the executable
  SQUASHFS_DIR="/config/poe2stash-app/squashfs-root"
  
  # Directly use the executable we know exists based on the log
  if [ -f "$SQUASHFS_DIR/poe2stash" ]; then
    echo "Found executable at $SQUASHFS_DIR/poe2stash, launching..." >> /tmp/poe2stash-startup.log
    cd "$SQUASHFS_DIR"
    chmod +x ./poe2stash
    
    # Set correct library paths
    export LD_LIBRARY_PATH="$SQUASHFS_DIR:$SQUASHFS_DIR/usr/lib:$LD_LIBRARY_PATH"
    
    # Run the application
    ./poe2stash --no-sandbox --disable-gpu-sandbox >> /tmp/poe2stash-app.log 2>&1 &
    APP_PID=$!
    
    echo "Application started with PID $APP_PID" >> /tmp/poe2stash-startup.log
    
    # Remove sentinel file
    rm -f "$SENTINEL_FILE"
    
    # Keep script running
    wait $APP_PID || echo "Application exited with code $?" >> /tmp/poe2stash-startup.log
    exit 0
  else
    echo "Executable not found at expected location $SQUASHFS_DIR/poe2stash" >> /tmp/poe2stash-startup.log
    echo "Listing all executables in squashfs-root:" >> /tmp/poe2stash-startup.log
    find "$SQUASHFS_DIR" -type f -executable >> /tmp/poe2stash-startup.log
    
    rm -f "$SENTINEL_FILE"  # Remove sentinel file
    exec xeyes  # Fall back to simple GUI app
  fi
else
  echo "AppImage not found at /app/POE2Stash.AppImage" >> /tmp/poe2stash-startup.log
  echo "Checking for any AppImage files..." >> /tmp/poe2stash-startup.log
  find /app -name "*.AppImage" >> /tmp/poe2stash-startup.log
  
  rm -f "$SENTINEL_FILE"  # Remove sentinel file
  exec xeyes  # Fall back to simple GUI app
fi

# Remove sentinel file on exit
rm -f "$SENTINEL_FILE"