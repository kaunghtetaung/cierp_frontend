# Production Files Sync Log

**Date**: November 16, 2025
**Action**: Downloaded working production files from GitLab server

## Backup Location
- Local backup: `.aProduction/backup/`
- Contains: Previous local configuration files

## Downloaded from GitLab Server
- Source: `ciadmin@git.crystal-image.net:~/ciapp_frontend/.aProduction/`
- Destination: Local `.aProduction/`

## Files Downloaded
- Docker configurations (3 files)
- Kubernetes deployments (5 files)
- Build scripts (8 files)
- README documentation

## New Scripts Available
1. `build-all.sh` - Build all services
2. `build-core.sh` - Build core only
3. `build-publicweb.sh` - Build publicWeb only
4. `build-with-proxy.sh` - Build with proxy support
5. `cleanup-old-deployments.sh` - Clean old deployments
6. `deploy-to-kubernetes-new.sh` - New deployment script
7. `deploy-to-kubernetes.sh` - Standard deployment
8. `push-to-harbor.sh` - Push to Harbor registry

## Notes
- All scripts have executable permissions
- Deployment files use latest working configuration
- Services configured: core (port 3001), publicweb (port 3002)
