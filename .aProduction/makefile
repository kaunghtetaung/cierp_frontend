rvproxy:
	ssh -i ~/.ssh/ciservers kaunghtet@192.168.200.3

master:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.11

worker1:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.21

worker2:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.22

mongodb:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.33

redis:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.32

minio:
	ssh -i ~/.ssh/ciservers ciadmin@2192.168.200.33

harbor:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.41

gitlab:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.42

mailServer:
	ssh -i ~/.ssh/ciservers root@mail.mmhub.info

moodle:
	ssh -i ~/.ssh/ciservers ciadmin@192.168.200.44
# Kubernetes cleanup and diagnostics
# Note: Scripts must be deployed to master first with 'make k8s-deploy-scripts'

k8s-deploy-scripts:
	ssh -i ~/.ssh/ciservers -p 42 ciadmin@203.81.66.116 'cd /workspace && ./.aProduction/scripts/deploy-scripts-to-master.sh'

k8s-diagnose:
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 'cd ~/k8s-scripts && ./diagnose-k8s-state.sh'

k8s-cleanup:
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 'cd ~/k8s-scripts && ./master-cleanup.sh'

k8s-redeploy:
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 'cd ~/k8s-scripts && ./complete-k8s-cleanup-and-redeploy.sh'

k8s-status:
	ssh -i ~/.ssh/ciservers -p 11 ciadmin@203.81.66.116 'kubectl get pods,deployments,services -n ciapp-backend'

keycopy:
	ssh-copy-id -i ~/.ssh/ciservers.pub kaunghtet@192.168.200.3
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.11
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.21
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.22
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.32
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.33
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.41
	ssh-copy-id -i ~/.ssh/ciservers.pub ciadmin@192.168.200.42
	ssh-copy-id -i ~/.ssh/ciservers.pub root@146.190.91.238

	
	
	ssh-copy-id -i ~/.ssh/ciservers.pub -p root@146.190.91.238

	
