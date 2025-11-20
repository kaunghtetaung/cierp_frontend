#!/bin/bash

# =================================================================
# Deploy New Frontend Images to Kubernetes
# Deploys Core and PublicWeb with new images from ciappfrontend project
# =================================================================

set -e

echo "========================================="
echo "  Deploy Frontend to Kubernetes"
echo "========================================="
echo ""

# K8s connection info
K8S_MASTER="ciadmin@192.168.200.11"
SSH_KEY="~/.ssh/ciservers"
SSH_PORT="22"
NAMESPACE="ciapp-frontend"
MANIFEST_DIR=".aProduction/k8s"

echo "K8s Master: $K8S_MASTER"
echo "Namespace: $NAMESPACE"
echo "Manifest Directory: $MANIFEST_DIR"
echo ""

# Verify manifests exist
if [ ! -d "$MANIFEST_DIR" ]; then
    echo "❌ Error: Manifest directory not found: $MANIFEST_DIR"
    exit 1
fi

# Create temp directory on K8s master
echo "Step 1: Preparing K8s master..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "mkdir -p ~/ciapp-frontend-deploy"
echo ""

# Copy manifests to K8s master
echo "Step 2: Copying manifests to K8s master..."
scp -i $SSH_KEY -P $SSH_PORT -r $MANIFEST_DIR/* $K8S_MASTER:~/ciapp-frontend-deploy/
echo ""

# Create namespace if not exists
echo "Step 3: Creating namespace (if not exists)..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl apply -f ~/ciapp-frontend-deploy/namespace.yaml"
echo ""

# Apply secrets if exists
if [ -f "$MANIFEST_DIR/secrets.yaml" ]; then
    echo "Step 4: Applying secrets..."
    ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl apply -f ~/ciapp-frontend-deploy/secrets.yaml"
    echo ""
fi

# Deploy Core
echo "Step 5: Deploying Core application..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl apply -f ~/ciapp-frontend-deploy/core/deployment.yaml"
echo ""

# Deploy PublicWeb
echo "Step 6: Deploying PublicWeb application..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl apply -f ~/ciapp-frontend-deploy/publicWeb/deployment.yaml"
echo ""

# Force rollout restart to pull latest images from Harbor
echo "Step 6a: Forcing rollout restart to pull latest images..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl rollout restart deployment/core -n $NAMESPACE"
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl rollout restart deployment/publicweb -n $NAMESPACE"
echo ""

# Wait for deployments to be ready
echo "Step 7: Waiting for deployments to be ready..."
echo ""
echo "  - Waiting for Core deployment..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl rollout status deployment/core -n $NAMESPACE --timeout=300s" || echo "⚠️  Core deployment taking longer than expected"

echo ""
echo "  - Waiting for PublicWeb deployment..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl rollout status deployment/publicweb -n $NAMESPACE --timeout=300s" || echo "⚠️  PublicWeb deployment taking longer than expected"

echo ""
echo "Step 8: Checking deployment status..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get deployments -n $NAMESPACE"
echo ""

echo "Step 9: Checking pod status..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get pods -n $NAMESPACE -o wide"
echo ""

echo "Step 10: Checking services..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get services -n $NAMESPACE"
echo ""

# Cleanup temp directory
echo "Cleaning up temp files on K8s master..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "rm -rf ~/ciapp-frontend-deploy"
echo ""

echo "========================================="
echo "  ✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Images deployed:"
echo "  - Core:      192.168.200.41/ciappfrontend/core:latest"
echo "  - PublicWeb: 192.168.200.41/ciappfrontend/publicweb:latest"
echo ""
echo "Useful commands:"
echo "  # Check logs"
echo "  ssh -i ~/.ssh/ciservers -p 11 $K8S_MASTER 'kubectl logs -f deployment/core -n $NAMESPACE'"
echo "  ssh -i ~/.ssh/ciservers -p 11 $K8S_MASTER 'kubectl logs -f deployment/publicweb -n $NAMESPACE'"
echo ""
echo "  # Check pod status"
echo "  ssh -i ~/.ssh/ciservers -p 11 $K8S_MASTER 'kubectl get pods -n $NAMESPACE'"
echo ""
echo "  # Restart deployment"
echo "  ssh -i ~/.ssh/ciservers -p 11 $K8S_MASTER 'kubectl rollout restart deployment/core -n $NAMESPACE'"
