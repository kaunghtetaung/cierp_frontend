#!/bin/bash

# Deploy Frontend to Kubernetes Script
# This script deploys frontend services to Kubernetes cluster

set -e  # Exit on error

# Check if REPO_DIR is provided or use current directory
REPO_DIR="${1:-.}"
cd "${REPO_DIR}"

# Load environment variables
export BASE_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
export IMAGE_TAG="v${BASE_VERSION}-${CI_COMMIT_REF_NAME:-main}.${CI_PIPELINE_ID:-local}"

# Configuration
K8S_NAMESPACE="ciapp-frontend"
SSH_KEY="~/.ssh/ciservers"
SSH_HOST="ciadmin@192.168.200.11"
SSH_PORT="22"

echo "════════════════════════════════════════════════════════════════"
echo " 🚀 Deploying Frontend Services to Kubernetes"
echo "════════════════════════════════════════════════════════════════"
echo " Version - ${IMAGE_TAG}"
echo " Branch - ${CI_COMMIT_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'N/A')}"
echo " Namespace - ${K8S_NAMESPACE}"
echo " Working Directory - $(pwd)"
echo ""

# Test SSH connection to K8s master
echo "Step 1: Testing SSH connection to Kubernetes master..."
if ! ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "echo 'SSH OK'" > /dev/null 2>&1; then
  echo "❌ Cannot SSH to Kubernetes master!"
  echo "   Check SSH key and connection: ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST}"
  exit 1
fi
echo "✅ SSH connection successful"
echo ""

# Create namespace if it doesn't exist
echo "Step 2: Ensuring namespace exists..."
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
echo "✅ Namespace ${K8S_NAMESPACE} ready"
echo ""

# Deploy services
echo "Step 3: Deploying frontend services..."
echo ""

# Deploy core application
echo "📦 Deploying core application..."
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl apply -f /dev/stdin" < .aProduction/k8s/core/deployment.yaml
echo "✅ Core application deployed"
sleep 3

# Deploy publicWeb
echo ""
echo "📦 Deploying publicWeb application..."
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl apply -f /dev/stdin" < .aProduction/k8s/publicWeb/deployment.yaml
echo "✅ PublicWeb application deployed"
echo ""

# Force rollout restart to ensure pods pick up configuration changes
echo "Step 4: Forcing rollout restart to apply changes..."
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl rollout restart deployment/core -n ${K8S_NAMESPACE}"
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl rollout restart deployment/publicweb -n ${K8S_NAMESPACE}"
echo "✅ Rollout restart triggered"
echo ""

# Wait for rollouts to complete
echo "Step 5: Waiting for rollouts to complete..."
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl rollout status deployment/publicweb -n ${K8S_NAMESPACE} --timeout=300s" || echo "⚠️  PublicWeb rollout taking longer than expected"
sleep 5

# Show deployment status
echo ""
echo "════════════════════════════════════════════════════════════════"
echo " 📊 Deployment Status"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Deployments:"
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl get deployments -n ${K8S_NAMESPACE}"

echo ""
echo "Pods:"
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl get pods -n ${K8S_NAMESPACE} -o wide"

echo ""
echo "Services:"
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl get services -n ${K8S_NAMESPACE}"

echo ""
echo "Pod Distribution:"
ssh -i ${SSH_KEY} -p ${SSH_PORT} ${SSH_HOST} "kubectl get pods -n ${K8S_NAMESPACE} -o wide --no-headers 2>/dev/null | awk '{print \$7}' | sort | uniq -c"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " ✅ Frontend Services Deployed Successfully!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Deployed Services:"
echo "   - core      : Main ERP application (2 replicas)"
echo "   - publicWeb : Public website (2 replicas)"
echo ""
echo "🌐 Access URLs (after ingress configuration):"
echo "   - Core:      https://core.mmhub.info"
echo "   - PublicWeb: https://www.mmhub.info"
echo ""
echo "💡 Tips:"
echo "   - Wait 30-60 seconds for pods to become ready"
echo "   - Check logs: kubectl logs -n ${K8S_NAMESPACE} <pod-name>"
echo "   - Port forward for testing: kubectl port-forward -n ${K8S_NAMESPACE} svc/core 3000:3000"
echo ""