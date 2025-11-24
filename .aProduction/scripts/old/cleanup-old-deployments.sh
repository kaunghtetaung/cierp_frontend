#!/bin/bash

# =================================================================
# Cleanup Old Frontend Deployments
# Removes old publicWeb and frontEndCore deployments from K8s
# =================================================================

set -e

echo "========================================="
echo "  Cleanup Old Frontend Deployments"
echo "========================================="
echo ""

# K8s connection info
K8S_MASTER="ciadmin@192.168.200.11"
SSH_KEY="~/.ssh/ciservers"
SSH_PORT="22"
NAMESPACE="ciapp-frontend"

echo "Connecting to K8s master: $K8S_MASTER"
echo "Namespace: $NAMESPACE"
echo ""

# Check if deployments exist
echo "Step 1: Checking existing deployments..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get deployments -n $NAMESPACE" || echo "No deployments found or namespace doesn't exist"
echo ""

# List all pods
echo "Step 2: Listing current pods..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get pods -n $NAMESPACE" || echo "No pods found"
echo ""

# Delete old deployments
echo "Step 3: Deleting old deployments..."
echo ""

# Delete publicweb deployment if exists
echo "  - Deleting publicweb deployment..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl delete deployment publicweb -n $NAMESPACE --ignore-not-found=true"

# Delete core deployment if exists
echo "  - Deleting core deployment..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl delete deployment core -n $NAMESPACE --ignore-not-found=true"

# Delete frontEndCore deployment if exists (old name)
echo "  - Deleting frontEndCore deployment (old name)..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl delete deployment frontEndCore -n $NAMESPACE --ignore-not-found=true"

echo ""
echo "Step 4: Waiting for pods to terminate..."
sleep 5

# Verify cleanup
echo ""
echo "Step 5: Verifying cleanup..."
ssh -i $SSH_KEY -p $SSH_PORT $K8S_MASTER "kubectl get pods -n $NAMESPACE" || echo "All pods terminated"
echo ""

echo "========================================="
echo "  ✅ Cleanup Complete!"
echo "========================================="
echo ""
echo "Old deployments have been removed."
echo "You can now deploy the new images."
echo ""
echo "Next step:"
echo "  ./deploy-to-kubernetes.sh"
