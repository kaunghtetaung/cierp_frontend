# Frontend Monorepo Makefile
# This Makefile provides convenient commands for development, building, and deployment

# =================================================================
# Server SSH Shortcuts
# =================================================================
# Gitlab Server - Connect to production server
gitlab:
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# Kubernetes Cluster SSH Access
master:
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116

worker1:
	ssh -i ~/.ssh/ciservers -p 21 ciadmin@203.81.66.116

worker2:
	ssh -i ~/.ssh/ciservers -p 22 ciadmin@203.81.66.116

# =================================================================
# Development Commands
# =================================================================

# Gitlab Server - Simple install (uses npx pnpm, works always)
gitlab-install-simple:
	@echo "Installing dependencies on production server (simple method)..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/install-simple.sh"

# Gitlab Server - Install pnpm first (run this if pnpm is not installed)
gitlab-install-pnpm:
	@echo "Installing pnpm locally on production server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && npm install pnpm"

# Gitlab Server - Install dependencies on production
gitlab-install:
	@echo "Installing dependencies on production server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && make install-production"

# Gitlab Server - Build on production
gitlab-build:
	@echo "Building on production server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && export PATH=\"\$$HOME/.local/share/pnpm:\$$PATH\" && make build-frontend"

# Gitlab Server - Production build (comprehensive)
gitlab-prod-build:
	@echo "Running production build on server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/production-build.sh"

# Gitlab Server - Full deployment
gitlab-deploy:
	@echo "Running full deployment on production server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/production-build.sh"

# Gitlab Server - Test network connectivity
gitlab-test-network:
	@echo "Testing network connectivity on GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/test-network.sh"

# Gitlab Server - Quick Google test
gitlab-test-google:
	@echo "Testing Google connectivity from GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "curl -I https://www.google.com"

# Gitlab Server - Remove Docker proxy
gitlab-remove-proxy:
	@echo "Removing Docker proxy configuration on GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "sudo rm -f /etc/systemd/system/docker.service.d/http-proxy.conf && sudo systemctl daemon-reload && sudo systemctl restart docker && echo 'Proxy removed. Checking...' && docker info | grep -i proxy || echo 'No proxy configured'"

# Gitlab Server - Build Docker images
gitlab-build-images:
	@echo "Building Docker images on GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/build-all.sh"

# Gitlab Server - Push images to Harbor
gitlab-push-images:
	@echo "Pushing images to Harbor from GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/push-images.sh"

# Gitlab Server - Build and push (complete workflow)
gitlab-build-and-push:
	@echo "========================================="
	@echo "  Building and Pushing Images"
	@echo "========================================="
	@echo ""
	@echo "Step 1: Building images on GitLab server..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/build-all.sh"
	@echo ""
	@echo "Step 2: Pushing images to Harbor..."
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net "cd ~/ciapp_frontend && bash ./.aProduction/scripts/push-images.sh"
	@echo ""
	@echo "✅ Build and push complete!"

# Run core application (ERP)
core:
	cd apps/core && pnpm run dev

# Run publicWeb application
public:
	cd apps/publicWeb && pnpm run dev

# Run both applications
dev:
	pnpm run dev

# Run with specific port for core
core-port:
	cd apps/core && PORT=3001 pnpm run dev

# Run with specific port for publicWeb
public-port:
	cd apps/publicWeb && PORT=3000 pnpm run dev

# =================================================================
# Build Commands
# =================================================================

# Build all applications
build:
	pnpm run build

# Build core application
build-core:
	cd apps/core && pnpm run build

# Build publicWeb application
build-public:
	cd apps/publicWeb && pnpm run build

# Type check
type-check:
	pnpm run type-check

# Lint check
lint:
	pnpm run lint

# =================================================================
# Production Build & Deploy
# =================================================================

# Build frontend Docker images
build-frontend:
	@echo "Building all frontend services..."
	./.aProduction/scripts/build-frontend-services.sh

# Build single service
build-single:
	@echo "Usage: make build-single SERVICE=core"
	@echo "       make build-single SERVICE=publicWeb"
	./.aProduction/scripts/build-single-frontend.sh $(SERVICE)

# Push images to Harbor
push-harbor:
	@echo "Pushing images to Harbor registry..."
	./.aProduction/scripts/push-to-harbor.sh

# Deploy to Kubernetes
deploy-k8s:
	@echo "Deploying to Kubernetes..."
	./.aProduction/scripts/deploy-to-kubernetes.sh

# Full deployment pipeline
deploy: build-frontend push-harbor deploy-k8s
	@echo "Full deployment complete!"

# =================================================================
# Git & Deployment Commands
# =================================================================

# Rsync deployment to production server (pushCi)
pushCi:
	@echo "========================================="
	@echo "  Deploying Frontend to Production"
	@echo "========================================="
	@echo "Step 1: Checking current branch..."
	$(eval CURRENT_BRANCH := $(shell git branch --show-current))
	@echo "Current branch: $(CURRENT_BRANCH)"
	@echo ""
	@echo "Step 2: Syncing code to production server..."
	@echo "  Source: $(PWD)/"
	@echo "  Target: ciadmin@192.168.200.42:~/ciapp_frontend/"
	@echo ""
	rsync -avz --delete \
		--exclude 'node_modules/' \
		--exclude '.next/' \
		--exclude 'dist/' \
		--exclude 'out/' \
		--exclude 'coverage/' \
		--exclude '.git/' \
		--exclude '*.log' \
		--exclude '.env*.local' \
		--exclude 'tmp/' \
		--exclude 'temp/' \
		--exclude '.DS_Store' \
		--exclude '.vscode/' \
		--exclude '.idea/' \
		--exclude '.turbo/' \
		--exclude '*.tsbuildinfo' \
		-e "ssh -i ~/.ssh/ciservers -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
		./ ciadmin@192.168.200.42:~/ciapp_frontend/
	@echo ""
	@echo "✅ Frontend deployment complete!"
	@echo ""
	@echo "========================================="
	@echo "  Next Steps on Production Server"
	@echo "========================================="
	@echo "  1. SSH into production:"
	@echo "     ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net"
	@echo ""
	@echo "  2. Navigate to frontend directory:"
	@echo "     cd ~/ciapp_frontend"
	@echo ""
	@echo "  3. Install dependencies (pnpm monorepo):"
	@echo "     make install-production"
	@echo "     # OR manually: pnpm install"
	@echo ""
	@echo "  4. Build Docker images:"
	@echo "     make build-frontend"
	@echo ""
	@echo "  5. Push to Harbor:"
	@echo "     make push-harbor"
	@echo ""
	@echo "  6. Deploy to Kubernetes:"
	@echo "     make deploy-k8s"
	@echo "========================================="

# Quick sync without git operations (for testing)
sync-only:
	@echo "Syncing code to production server (without git operations)..."
	rsync -avz --delete \
		--exclude 'node_modules/' \
		--exclude '.next/' \
		--exclude 'dist/' \
		--exclude 'out/' \
		--exclude 'coverage/' \
		--exclude '.git/' \
		--exclude '*.log' \
		--exclude '.env*.local' \
		--exclude 'tmp/' \
		--exclude 'temp/' \
		--exclude '.DS_Store' \
		--exclude '.vscode/' \
		--exclude '.idea/' \
		--exclude '.turbo/' \
		--exclude '*.tsbuildinfo' \
		-e "ssh -i ~/.ssh/ciservers -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
		./ ciadmin@git.crystal-image.net:~/ciapp_frontend/
	@echo "✅ Sync complete!"

# Push to GitHub
pushGit:
	@echo "Pushing current branch to GitHub..."
	git push origin $$(git branch --show-current)

# Pull from GitHub
pullGit:
	@echo "Pulling current branch from GitHub..."
	git pull origin $$(git branch --show-current)

# Git status
git-status:
	@echo "Git Status:"
	git status
	@echo ""
	@echo "Current branch: $$(git branch --show-current)"
	@echo ""
	@echo "Recent commits:"
	git log --oneline -5

# =================================================================
# Testing Commands
# =================================================================

test:
	pnpm test

test-watch:
	pnpm run test:watch

test-coverage:
	pnpm run test:coverage

# =================================================================
# Clean Commands
# =================================================================

clean:
	rm -rf node_modules
	rm -rf apps/core/node_modules
	rm -rf apps/publicWeb/node_modules
	rm -rf apps/core/.next
	rm -rf apps/publicWeb/.next
	rm -rf dist
	rm -rf .turbo
	find . -name "*.tsbuildinfo" -delete

clean-cache:
	rm -rf apps/core/.next
	rm -rf apps/publicWeb/.next
	rm -rf .turbo

# =================================================================
# Install Commands
# =================================================================

install:
	@command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm || sudo npm install -g pnpm; }
	pnpm install

install-ci:
	@command -v pnpm >/dev/null 2>&1 || { echo "Installing pnpm..."; npm install -g pnpm || sudo npm install -g pnpm; }
	pnpm install --frozen-lockfile

install-production:
	@echo "Running production installation script..."
	./.aProduction/scripts/install-production.sh

# =================================================================
# Docker Commands (Local Development)
# =================================================================

docker-build-core:
	docker build -f .aProduction/Docker/Dockerfile.core -t frontend-core:local .

docker-build-public:
	docker build -f .aProduction/Docker/Dockerfile.publicWeb -t frontend-public:local .

docker-run-core:
	docker run -p 3001:3000 --env-file apps/core/.env frontend-core:local

docker-run-public:
	docker run -p 3000:3000 --env-file apps/publicWeb/.env frontend-public:local

# =================================================================
# Kubernetes Commands (Remote Cluster via SSH)
# =================================================================

# Apply K8s configurations to remote cluster
k8s-apply:
	@echo "Applying K8s configurations to remote cluster..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/namespace.yaml && \
		kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/secrets.yaml && \
		kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/core/deployment.yaml && \
		kubectl apply -f ~/ciapp_frontend/.aProduction/k8s/publicWeb/deployment.yaml"

# Delete K8s resources from remote cluster
k8s-delete:
	@echo "Deleting K8s resources from remote cluster..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl delete -f ~/ciapp_frontend/.aProduction/k8s/publicWeb/deployment.yaml || true && \
		kubectl delete -f ~/ciapp_frontend/.aProduction/k8s/core/deployment.yaml || true && \
		kubectl delete -f ~/ciapp_frontend/.aProduction/k8s/secrets.yaml || true && \
		kubectl delete -f ~/ciapp_frontend/.aProduction/k8s/namespace.yaml || true"

# Show K8s deployment status
k8s-status:
	@echo "Getting K8s status from remote cluster..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get all -n ciapp-frontend"

# Show detailed pod information
k8s-pods:
	@echo "Getting pod details from remote cluster..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get pods -n ciapp-frontend -o wide"

# Clean up old ReplicaSets with 0/0 pods
k8s-clean-old-replicasets:
	@echo "========================================="
	@echo "  Cleaning Old ReplicaSets (0/0)"
	@echo "========================================="
	@echo "Removing old ReplicaSets from remote cluster..."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl get replicasets -n ciapp-frontend && \
		echo '' && \
		echo 'Deleting ReplicaSets with 0 desired pods...' && \
		kubectl delete replicaset -n ciapp-frontend \
			--field-selector=status.replicas=0 \
			2>/dev/null || echo 'No old ReplicaSets to delete'"
	@echo ""
	@echo "✅ Old ReplicaSets cleaned!"
	@echo ""
	@echo "Remaining ReplicaSets:"
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get replicasets -n ciapp-frontend"

# Delete old frontend pods (clean up old deployments)
k8s-clean-old-pods:
	@echo "========================================="
	@echo "  Cleaning Old Frontend Pods"
	@echo "========================================="
	@echo "Deleting old pods from remote cluster..."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl delete pod frontend-core-5f9d49b98b-2ghtn -n ciapp-frontend --ignore-not-found=true && \
		kubectl delete pod frontend-publicweb-589d5775bf-grz2k -n ciapp-frontend --ignore-not-found=true"
	@echo ""
	@echo "✅ Old pods deleted!"
	@echo ""
	@echo "Checking remaining pods..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get pods -n ciapp-frontend"

# Complete cleanup: ReplicaSets + Pods
k8s-clean-all-old:
	@echo "========================================="
	@echo "  Complete Cleanup: ReplicaSets + Pods"
	@echo "========================================="
	@echo "Step 1: Cleaning old ReplicaSets (0/0)..."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl delete replicaset -n ciapp-frontend \
			--field-selector=status.replicas=0 \
			2>/dev/null || echo 'No old ReplicaSets found'"
	@echo ""
	@echo "Step 2: Cleaning old pods..."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl delete pod frontend-core-5f9d49b98b-2ghtn -n ciapp-frontend --ignore-not-found=true && \
		kubectl delete pod frontend-publicweb-589d5775bf-grz2k -n ciapp-frontend --ignore-not-found=true"
	@echo ""
	@echo "✅ Cleanup complete!"
	@echo ""
	@echo "Current state:"
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get all -n ciapp-frontend"

# Restart frontend deployments (force new pods)
k8s-restart-frontend:
	@echo "========================================="
	@echo "  Restarting Frontend Deployments"
	@echo "========================================="
	@echo "Rolling restart of core and publicWeb..."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl rollout restart deployment/core -n ciapp-frontend && \
		kubectl rollout restart deployment/publicweb -n ciapp-frontend"
	@echo ""
	@echo "✅ Restart initiated!"
	@echo ""
	@echo "Monitoring rollout status..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl rollout status deployment/core -n ciapp-frontend && \
		kubectl rollout status deployment/publicweb -n ciapp-frontend"

# Force delete all frontend pods (emergency cleanup)
k8s-force-clean-all:
	@echo "========================================="
	@echo "  WARNING: Force Deleting All Frontend Pods"
	@echo "========================================="
	@echo "This will delete ALL frontend pods in the namespace!"
	@echo "Kubernetes will automatically recreate them."
	@echo ""
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "\
		kubectl delete pods -n ciapp-frontend -l app=core --force --grace-period=0 && \
		kubectl delete pods -n ciapp-frontend -l app=publicweb --force --grace-period=0"
	@echo ""
	@echo "✅ All pods force deleted!"
	@echo ""
	@echo "Waiting for new pods to start..."
	sleep 5
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get pods -n ciapp-frontend"

# View logs from core deployment
k8s-logs-core:
	@echo "Streaming logs from core deployment..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl logs -n ciapp-frontend deployment/core --follow"

# View logs from publicWeb deployment
k8s-logs-public:
	@echo "Streaming logs from publicWeb deployment..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl logs -n ciapp-frontend deployment/publicweb --follow"

# Describe pod (for debugging)
k8s-describe-pod:
	@echo "Usage: make k8s-describe-pod POD=<pod-name>"
	@echo "Example: make k8s-describe-pod POD=frontend-core-5f9d49b98b-2ghtn"
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl describe pod $(POD) -n ciapp-frontend"

# Get events in namespace (for troubleshooting)
k8s-events:
	@echo "Getting recent events from ciapp-frontend namespace..."
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 "kubectl get events -n ciapp-frontend --sort-by='.lastTimestamp'"

# =================================================================
# Help
# =================================================================

help:
	@echo "Frontend Monorepo - Available Commands"
	@echo "======================================"
	@echo ""
	@echo "Development Commands:"
	@echo "  make core              - Run core application (ERP)"
	@echo "  make public            - Run publicWeb application"
	@echo "  make dev               - Run both applications"
	@echo "  make core-port         - Run core on port 3001"
	@echo "  make public-port       - Run publicWeb on port 3000"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build             - Build all applications"
	@echo "  make build-core        - Build core application"
	@echo "  make build-public      - Build publicWeb application"
	@echo "  make type-check        - Run TypeScript type checking"
	@echo "  make lint              - Run linting"
	@echo ""
	@echo "Production Deployment:"
	@echo "  make pushCi            - Deploy to production server (~/ciapp_frontend)"
	@echo "  make sync-only         - Sync files without git operations"
	@echo "  make build-frontend    - Build Docker images for production"
	@echo "  make push-harbor       - Push images to Harbor registry"
	@echo "  make deploy-k8s        - Deploy to Kubernetes cluster"
	@echo "  make deploy            - Full deployment pipeline"
	@echo ""
	@echo "Git Commands:"
	@echo "  make pushGit           - Push current branch to GitHub"
	@echo "  make pullGit           - Pull current branch from GitHub"
	@echo "  make git-status        - Show git status and recent commits"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-build-core - Build core Docker image"
	@echo "  make docker-build-public - Build publicWeb Docker image"
	@echo "  make docker-run-core   - Run core in Docker"
	@echo "  make docker-run-public - Run publicWeb in Docker"
	@echo ""
	@echo "Kubernetes Commands (Remote Cluster):"
	@echo "  make k8s-apply                  - Apply K8s configurations to cluster"
	@echo "  make k8s-delete                 - Delete K8s resources from cluster"
	@echo "  make k8s-status                 - Show deployment status"
	@echo "  make k8s-pods                   - Show detailed pod information"
	@echo "  make k8s-clean-old-replicasets  - Delete old ReplicaSets (0/0)"
	@echo "  make k8s-clean-old-pods         - Delete specific old pods"
	@echo "  make k8s-clean-all-old          - Complete cleanup (ReplicaSets + Pods)"
	@echo "  make k8s-restart-frontend       - Rolling restart of deployments"
	@echo "  make k8s-force-clean-all        - Force delete all pods (emergency)"
	@echo "  make k8s-logs-core              - Follow core deployment logs"
	@echo "  make k8s-logs-public            - Follow publicWeb logs"
	@echo "  make k8s-describe-pod           - Describe specific pod (POD=name)"
	@echo "  make k8s-events                 - Show namespace events"
	@echo ""
	@echo "SSH Shortcuts:"
	@echo "  make gitlab                 - SSH to GitLab server"
	@echo "  make master                 - SSH to K8s master node"
	@echo "  make worker1                - SSH to K8s worker1 node"
	@echo "  make worker2                - SSH to K8s worker2 node"
	@echo ""
	@echo "Remote Build Commands:"
	@echo "  make gitlab-install         - Install deps on production"
	@echo "  make gitlab-build           - Build images on production"
	@echo "  make gitlab-deploy          - Full deployment on production"
	@echo "  make gitlab-build-images    - Build Docker images on GitLab"
	@echo "  make gitlab-push-images     - Push images to Harbor from GitLab"
	@echo "  make gitlab-build-and-push  - Build and push (complete workflow)"
	@echo "  make gitlab-test-network    - Test network connectivity on GitLab"
	@echo "  make gitlab-test-google     - Quick Google connectivity test"
	@echo "  make gitlab-remove-proxy    - Remove Docker proxy configuration"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make test              - Run tests"
	@echo "  make test-watch        - Run tests in watch mode"
	@echo "  make test-coverage     - Run tests with coverage"
	@echo "  make clean             - Clean all build artifacts"
	@echo "  make clean-cache       - Clean Next.js cache"
	@echo "  make install           - Install dependencies"
	@echo "  make help              - Show this help message"

# Default target
.DEFAULT_GOAL := help