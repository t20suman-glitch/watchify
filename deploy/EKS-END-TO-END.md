# End-to-end: Jenkins master → EKS → Watchify deployment

**Repo:** https://github.com/t20suman-glitch/watchify.git  
**Docker Hub:** `t20suman`  
**Domain:** `watchify.sumanmodak.in`  
**Manifests:** `deploy/k8s/`

This guide walks from zero to a running app on **EKS (public/private VPC)** with **Jenkins CI**, **ArgoCD CD**, **ALB**, and **S3**.

---

## Architecture overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Jenkins master EC2 (tools only — NOT in EKS)                           │
│  Jenkins · Docker · kubectl · aws cli · eksctl · helm · trivy           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ CI1: build + push Docker Hub
                                │ CI2: update k8s YAML + git push
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  GitHub (t20suman-glitch/watchify)                                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ ArgoCD watches deploy/k8s
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  EKS cluster (private worker nodes, public ALB)                         │
│                                                                         │
│  Internet ──► ALB (public subnets) ──► frontend:3000                    │
│                                    └──► upload-service:3002 (/api/...)  │
│                                                                         │
│  Pods (private subnets): user · upload · watch · frontend · mongo       │
│  upload-service ──IRSA──► S3 (via VPC Gateway endpoint, no internet)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0 — AWS account prep

| Item | Action |
|------|--------|
| AWS account | Admin or scoped IAM user for EKS/VPC/IAM |
| Region | Pick one (example: `us-east-1`) — use **same region** for EKS, S3, ACM |
| Domain | `watchify.sumanmodak.in` in Route 53 (or external DNS → ALB later) |
| Docker Hub | Account `t20suman`, create repos: `user-service`, `upload-service`, `watch-service`, `frontend` |
| GitHub PAT | For Jenkins CI2 push — scope: `repo` |

---

## Phase 1 — Jenkins master machine (EC2)

A dedicated **build server**. It does **not** need to be inside the EKS cluster.

### 1.1 Launch EC2

| Setting | Recommendation |
|---------|----------------|
| AMI | Ubuntu 22.04 LTS |
| Instance | `t3.large` (Jenkins + Docker builds) |
| Storage | 80 GB+ |
| VPC | Same account/region as EKS (can be separate VPC) |
| Security group | SSH (22) from your IP; Jenkins UI (8080) from your IP |
| IAM role | Optional: ECR read if you switch from Docker Hub later |

### 1.2 Base packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip apt-transport-https ca-certificates gnupg lsb-release openjdk-21-jdk

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# log out and back in

# AWS CLI v2
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl

# eksctl
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar xzf eksctl_*.tar.gz && sudo mv eksctl /usr/local/bin

# Helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Trivy (CI1 scan)
sudo apt install -y wget apt-transport-https
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb generic main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt update && sudo apt install -y trivy

# SonarQube scanner (CI1)
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux-x64.zip
unzip sonar-scanner-cli-*.zip
sudo mv sonar-scanner-*-linux-x64 /opt/sonar-scanner
echo 'export PATH=$PATH:/opt/sonar-scanner/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
docker --version && aws --version && kubectl version --client && eksctl version && helm version && trivy --version
```

### 1.3 Jenkins

**Java 21 required** — Jenkins LTS 2.555+ no longer supports Java 17. Install **before** Jenkins:

```bash
sudo apt install -y openjdk-21-jdk
sudo update-alternatives --config java   # pick java-21-openjdk-amd64
java -version   # must show 21.x
```

```bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update && sudo apt install -y jenkins
sudo usermod -aG docker jenkins
```

Point Jenkins at Java 21 (if the service still fails):

```bash
sudo systemctl edit jenkins
```

Add:

```ini
[Service]
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable jenkins && sudo systemctl start jenkins
sudo systemctl status jenkins
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Open `http://<jenkins-ec2-ip>:8080`, complete setup, install suggested plugins plus:

- Pipeline
- Git
- OWASP Dependency-Check
- SonarQube Scanner

### 1.4 OWASP Dependency-Check (global tool)

Manage Jenkins → Global Tool Configuration → Dependency-Check:

- Name: `dependency-check`
- Install automatically (or point to `/usr/local/bin` if installed manually)

Download from: https://github.com/jeremylong/DependencyCheck/releases

### 1.5 SonarQube (server)

Option A — SonarCloud (easiest): https://sonarcloud.io — link GitHub repo, get token.

Option B — Self-hosted SonarQube on another EC2 or Docker.

Jenkins → Manage Jenkins → System → SonarQube servers:

- Name: `SonarQube`
- Server URL + authentication token

### 1.6 Jenkins credentials

| ID | Type | Purpose |
|----|------|---------|
| `dockerhub` | Username/password | Docker Hub `t20suman` |
| `git-credentials` | Username/password | GitHub PAT for CI2 push |

### 1.7 Jenkins jobs

Create two **Pipeline** jobs from SCM:

| Job | Script path |
|-----|-------------|
| `watchify-ci1-build` | `deploy/jenkins/ci1-build.Jenkinsfile` |
| `watchify-ci2-manifest` | `deploy/jenkins/ci2-manifest.Jenkinsfile` |

- SCM URL: `https://github.com/t20suman-glitch/watchify.git`
- CI1: parameterized (`DOCKER_TAG`, `GIT_BRANCH`)
- CI2: **no** poll SCM — triggered only by CI1

### 1.8 AWS credentials on Jenkins master

```bash
aws configure
# AWS Access Key ID, Secret, region us-east-1
```

Used for `eksctl`, `kubectl`, and optional AWS CLI steps.

---

## Phase 2 — Network + EKS cluster (public/private)

Run from Jenkins master (or CloudShell) with AWS CLI configured.

### 2.1 Create cluster with eksctl (recommended)

Save as `cluster.yaml`:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: watchify
  region: us-east-1
  version: "1.29"

vpc:
  cidr: 10.0.0.0/16
  nat:
    gateway: Single    # nodes in private subnets reach internet via NAT (pull images, etc.)

managedNodeGroups:
  - name: workers
    instanceType: t3.medium
    desiredCapacity: 3
    minSize: 2
    maxSize: 4
    volumeSize: 50
    privateNetworking: true   # worker nodes in PRIVATE subnets

cloudWatch:
  clusterLogging:
    enableTypes: ["api", "audit", "authenticator"]
```

```bash
eksctl create cluster -f cluster.yaml
# ~15–20 minutes
```

This creates:

- VPC with **public + private subnets**
- NAT gateway (for nodes to pull Docker Hub images, etc.)
- EKS control plane
- 3 worker nodes in **private subnets**

### 2.2 Tag subnets for ALB (required)

```bash
# List subnets for the cluster VPC
aws ec2 describe-subnets --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=watchify" \
  --query 'Subnets[*].[SubnetId,Tags]' --output table

# Public subnets — tag for internet-facing ALB
aws ec2 create-tags --resources subnet-XXXX --tags Key=kubernetes.io/role/elb,Value=1

# Private subnets — tag for internal LB (optional) and node placement
aws ec2 create-tags --resources subnet-YYYY --tags Key=kubernetes.io/role/internal-elb,Value=1
```

eksctl often tags these automatically; verify with:

```bash
aws ec2 describe-subnets --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=watchify" \
  --query 'Subnets[*].[SubnetId,MapPublicIpOnLaunch,Tags[?Key==`kubernetes.io/role/elb`].Value|[0]]'
```

### 2.3 Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name watchify
kubectl get nodes
# 3 nodes Ready
```

---

## Phase 3 — EKS add-ons (before app deploy)

### 3.1 AWS Load Balancer Controller

```bash
# OIDC provider (for IRSA)
eksctl utils associate-iam-oidc-provider --cluster watchify --approve

# IAM policy for controller
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam-policy.json

# IRSA for controller
eksctl create iamserviceaccount \
  --cluster=watchify \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Helm install
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=watchify \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

kubectl get ingressclass
# alb    ingress.k8s.aws/alb
```

### 3.2 ACM certificate (HTTPS)

```bash
# Request cert (DNS validation)
aws acm request-certificate \
  --domain-name watchify.sumanmodak.in \
  --validation-method DNS \
  --region us-east-1

# Add CNAME records in Route 53 from ACM console until status = ISSUED
```

Copy cert ARN → edit `deploy/k8s/ingress.example.yaml`:

```yaml
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
```

Also replace `ACCOUNT_ID` in `deploy/k8s/upload-service.yaml` (IRSA role ARN).

### 3.3 S3 bucket + private access

```bash
# Create bucket (when ready — replace name)
aws s3 mb s3://YOUR-BUCKET-NAME --region us-east-1
aws s3api put-bucket-encryption --bucket YOUR-BUCKET-NAME \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

Edit `deploy/k8s/configmap.yaml`:

```yaml
AWS_S3_BUCKET: "YOUR-BUCKET-NAME"
AWS_REGION: "us-east-1"
```

**S3 Gateway VPC endpoint** (private S3 access):

```bash
VPC_ID=$(aws eks describe-cluster --name watchify --query 'cluster.resourcesVpcConfig.vpcId' --output text)
# Get private route table IDs, then:
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-XXXX rtb-YYYY
```

**IAM policy for upload-service** — use `deploy/k8s/iam-upload-s3-policy.example.json` (replace bucket name):

```bash
aws iam create-policy --policy-name watchify-upload-s3 \
  --policy-document file://deploy/k8s/iam-upload-s3-policy.example.json
```

**IRSA for upload-service:**

```bash
eksctl create iamserviceaccount \
  --cluster=watchify \
  --region=us-east-1 \
  --namespace=watchify \
  --name=upload-service \
  --role-name=watchify-upload-service \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/watchify-upload-s3 \
  --approve
```

Update `deploy/k8s/upload-service.yaml` ServiceAccount annotation with the role ARN.

Optional hardening: `deploy/k8s/bucket-policy-vpce.example.json`

---

## Phase 4 — First image build (Jenkins CI1)

Before K8s can pull images, they must exist on Docker Hub.

### Option A — Jenkins (recommended)

1. Open Jenkins → `watchify-ci1-build` → **Build with Parameters**
2. `DOCKER_TAG` = `v1.0`
3. Wait for all stages (scan, build, push)
4. CI2 auto-triggers → updates `deploy/k8s/*.yaml` tags → pushes to GitHub

### Option B — Manual on Jenkins master

```bash
git clone https://github.com/t20suman-glitch/watchify.git
cd watchify
TAG=v1.0

docker build -t t20suman/user-service:$TAG ./services/user-service
docker build -t t20suman/upload-service:$TAG ./services/upload-service
docker build -t t20suman/watch-service:$TAG ./services/watch-service
docker build -t t20suman/frontend:$TAG ./frontend

docker login
docker push t20suman/user-service:$TAG
docker push t20suman/upload-service:$TAG
docker push t20suman/watch-service:$TAG
docker push t20suman/frontend:$TAG

# Update manifest tags
chmod +x deploy/jenkins/scripts/update-k8s-images.sh
./deploy/jenkins/scripts/update-k8s-images.sh $TAG t20suman
git add deploy/k8s/*.yaml && git commit -m "chore: images $TAG" && git push
```

If Docker Hub repos are **private**, create pull secret on EKS:

```bash
kubectl create namespace watchify --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret docker-registry dockerhub -n watchify \
  --docker-username=t20suman \
  --docker-password=YOUR_DOCKERHUB_TOKEN
```

Add to each Deployment under `spec.template.spec`:

```yaml
imagePullSecrets:
  - name: dockerhub
```

---

## Phase 5 — Deploy app to EKS

### 5.1 Secrets

```bash
cd watchify/deploy/k8s
cp secrets.example.yaml secrets.yaml
# Edit: JWT_SECRET = long random string (same for user + watch services)
kubectl apply -f secrets.yaml
```

### 5.2 Apply manifests

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml      # S3 bucket must be set
kubectl apply -f mongodb.yaml
kubectl wait --for=condition=ready pod/mongodb-0 -n watchify --timeout=300s

kubectl apply -f upload-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f watch-service.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.example.yaml
```

### 5.3 Verify pods

```bash
kubectl get pods -n watchify
kubectl get svc -n watchify
kubectl get ingress -n watchify
kubectl logs -n watchify deploy/upload-service --tail=30
# /health should show "storage":"s3"
```

### 5.4 DNS

Get ALB hostname:

```bash
kubectl get ingress watchify -n watchify -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Route 53 → A record (alias) `watchify.sumanmodak.in` → that ALB.

---

## Phase 6 — ArgoCD (CD)

Install ArgoCD on the same EKS cluster (or a management cluster):

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Port-forward UI (or expose via Ingress)
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Initial admin password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Create Application (UI or YAML):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: watchify
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/t20suman-glitch/watchify.git
    targetRevision: main
    path: deploy/k8s
    directory:
      exclude: '{secrets.example.yaml,ingress.example.yaml,*.example.json,README.md}'
  destination:
    server: https://kubernetes.default.svc
    namespace: watchify
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Note:** Apply `secrets.yaml` and `ingress.example.yaml` manually once (not in git). ArgoCD syncs the rest. After Jenkins CI2 bumps image tags, ArgoCD auto-syncs new versions.

---

## Phase 7 — End-to-end release flow (steady state)

```text
1. Developer merges to main
2. Jenkins CI1 — Build with Parameters DOCKER_TAG=v1.1
   ├── scans (Trivy, OWASP, SonarQube)
   ├── docker build + push t20suman/*:v1.1
   └── triggers CI2
3. Jenkins CI2
   ├── updates deploy/k8s/*.yaml image tags to v1.1
   └── git push to GitHub
4. ArgoCD detects git change → syncs EKS
5. Rolling update of pods with new images
6. Users hit https://watchify.sumanmodak.in via ALB
```

---

## Checklist summary

| Phase | Done? |
|-------|-------|
| Jenkins EC2 + tools | ☐ |
| Jenkins jobs CI1 + CI2 | ☐ |
| EKS cluster (private nodes) | ☐ |
| Subnet tags for ALB | ☐ |
| AWS Load Balancer Controller | ☐ |
| ACM cert + Route 53 | ☐ |
| S3 bucket + VPC endpoint + IRSA | ☐ |
| configmap.yaml S3 bucket set | ☐ |
| secrets.yaml JWT applied | ☐ |
| Images on Docker Hub `t20suman/*` | ☐ |
| K8s manifests applied | ☐ |
| Ingress ALB + DNS | ☐ |
| ArgoCD Application | ☐ |
| First CI1 run successful | ☐ |

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `ImagePullBackOff` | Image exists on Docker Hub? Private repo → `imagePullSecrets` |
| Upload fails S3 | `AWS_S3_BUCKET` set? IRSA role attached? VPC endpoint? |
| Ingress no ADDRESS | AWS LB Controller logs: `kubectl logs -n kube-system deploy/aws-load-balancer-controller` |
| 502 from ALB | Pod readiness: `kubectl describe pod -n watchify` |
| CI2 git push fails | GitHub PAT scope `repo`, credential ID `git-credentials` |
| SonarQube gate fails | Fix issues or adjust quality gate in SonarQube |
| Jenkins won't start | **Use Java 21** — LTS 2.555+ dropped Java 17; see Phase 1.3 |

---

## Related docs

- [EKS-DEPLOY.md](EKS-DEPLOY.md) — checklist + placeholders
- [k8s/README.md](k8s/README.md) — manifest reference
- [jenkins/README.md](jenkins/README.md) — pipeline details
