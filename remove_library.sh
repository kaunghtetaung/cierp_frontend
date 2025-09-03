#!/bin/bash

# Script to remove the root-owned library directory
echo "This script will remove the root-owned library directory"
echo "You will need to enter your password for sudo access"
echo ""

# Remove the library directory
sudo rm -rf apps/library

# Verify removal
if [ -d "apps/library" ]; then
    echo "Failed to remove library directory"
    exit 1
else
    echo "Successfully removed library directory"
    echo ""
    echo "Current apps directory:"
    ls -la apps/
fi