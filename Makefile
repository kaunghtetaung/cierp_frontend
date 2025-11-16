# Frontend Monorepo Makefile
# This Makefile provides convenient commands for development, building, and deployment

# =================================================================
# Development Commands
# =================================================================
# Gitlab Server
gitlab:
	ssh -i ~/.ssh/ciservers ciadmin@git.crystal-image.net

# Run core application (ERP)
core:
	cd apps/core && npm run dev

# Run publicWeb application
public:
	cd apps/publicWeb && npm run dev

# Run both applications
dev:
	npm run dev

# Run with specific port for core
core-port:
	cd apps/core && PORT=3001 npm run dev

# Run with specific port for publicWeb
public-port:
	cd apps/publicWeb && PORT=3000 npm run dev

# =================================================================
# Build Commands
# =================================================================

# Build all applications
build:
	npm run build

# Build core application
build-core:
	cd apps/core && npm run build

# Build publicWeb application
build-public:
	cd apps/publicWeb && npm run build

# Type check
type-check:
	npm run type-check

# Lint check
lint:
	npm run lint

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
	@echo "Step 1: Saving current branch..."
	$(eval CURRENT_BRANCH := $(shell git branch --show-current))
	@echo "Current branch: $(CURRENT_BRANCH)"
	@echo ""
	@echo "Step 2: Switching to main branch..."
	git checkout main
	@echo ""
	@echo "Step 3: Merging dailyDev into main..."
	git merge dailyDev -m "Merge dailyDev to main for production deployment"
	@echo ""
	@echo "Step 4: Syncing code to production server..."
	@echo "  Source: $(PWD)/"
	@echo "  Target: ciadmin@git.crystal-image.net:~/ciapp_frontend/"
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
		./ ciadmin@git.crystal-image.net:~/ciapp_frontend/
	@echo ""
	@echo "Step 5: Returning to original branch ($(CURRENT_BRANCH))..."
	git checkout $(CURRENT_BRANCH)
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
	@echo "  3. Install dependencies (with React 19 compatibility):"
	@echo "     make install-production"
	@echo "     # OR manually: npm install --legacy-peer-deps"
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
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

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
	npm install --legacy-peer-deps

install-ci:
	npm ci --legacy-peer-deps

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
# Kubernetes Commands (Local Testing)
# =================================================================

k8s-apply:
	kubectl apply -f .aProduction/k8s/namespace.yaml
	kubectl apply -f .aProduction/k8s/secrets.yaml
	kubectl apply -f .aProduction/k8s/core/deployment.yaml
	kubectl apply -f .aProduction/k8s/publicWeb/deployment.yaml

k8s-delete:
	kubectl delete -f .aProduction/k8s/publicWeb/deployment.yaml || true
	kubectl delete -f .aProduction/k8s/core/deployment.yaml || true
	kubectl delete -f .aProduction/k8s/secrets.yaml || true
	kubectl delete -f .aProduction/k8s/namespace.yaml || true

k8s-status:
	kubectl get all -n ciapp-frontend

k8s-logs-core:
	kubectl logs -n ciapp-frontend deployment/core --follow

k8s-logs-public:
	kubectl logs -n ciapp-frontend deployment/publicweb --follow

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
	@echo "Kubernetes Commands:"
	@echo "  make k8s-apply         - Apply K8s configurations"
	@echo "  make k8s-delete        - Delete K8s resources"
	@echo "  make k8s-status        - Show K8s deployment status"
	@echo "  make k8s-logs-core     - Follow core logs"
	@echo "  make k8s-logs-public   - Follow publicWeb logs"
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