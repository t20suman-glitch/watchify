# EKS deployment checklist — Watchify

Repo: **https://github.com/t20suman-glitch/watchify.git**  
Docker Hub: **t20suman**  
Domain: **watchify.sumanmodak.in**

---

## Ready in repo (no action needed)

| Item | Location |
|------|----------|
| K8s manifests (flat `deploy/k8s/`) | All YAML files |
| ALB Ingress (not nginx) | `ingress.example.yaml` |
| S3 upload-service code | `services/upload-service/src/storage/s3StorageProvider.js` |
| IRSA ServiceAccount template | `upload-service.yaml` |
| Jenkins CI1 + CI2 | `deploy/jenkins/` |
| Image names | `t20suman/user-service`, `upload-service`, `watch-service`, `frontend` |
| SonarQube config | `sonar-project.properties` |

---

## You must configure before deploy

### 1. AWS account placeholders

| File | Replace |
|------|---------|
| `upload-service.yaml` | `ACCOUNT_ID` in IRSA role ARN |
| `ingress.example.yaml` | `ACCOUNT_ID` + `REPLACE_ACM_CERT_ID` in ACM ARN |
| `iam-upload-s3-policy.example.json` | bucket name |
| `bucket-policy-vpce.example.json` | bucket + `vpce-...` |

### 2. S3 bucket (when created)

Edit `deploy/k8s/configmap.yaml`:

```yaml
AWS_S3_BUCKET: "your-bucket-name"
AWS_REGION: "us-east-1"   # same region as EKS
```

Then:

- Create bucket + encryption
- S3 **Gateway VPC endpoint** on private route tables
- IAM policy from `iam-upload-s3-policy.example.json`
- IRSA for `upload-service` (see below)

### 3. Secrets (never commit)

```bash
cd deploy/k8s
cp secrets.example.yaml secrets.yaml
# Set JWT_SECRET (long random string)
kubectl apply -f secrets.yaml
```

### 4. Docker Hub images

Build and push (or run Jenkins CI1 with tag e.g. `v1.0`):

```bash
docker build -t t20suman/user-service:v1.0 ./services/user-service
docker build -t t20suman/upload-service:v1.0 ./services/upload-service
docker build -t t20suman/watch-service:v1.0 ./services/watch-service
docker build -t t20suman/frontend:v1.0 ./frontend

docker push t20suman/user-service:v1.0
docker push t20suman/upload-service:v1.0
docker push t20suman/watch-service:v1.0
docker push t20suman/frontend:v1.0
```

Update `image:` tags in `deploy/k8s/*.yaml` to match (Jenkins CI2 does this automatically).

**Private Docker Hub repos?** Create pull secret on EKS:

```bash
kubectl create secret docker-registry dockerhub \
  -n watchify \
  --docker-username=t20suman \
  --docker-password=YOUR_TOKEN
```

Add to each Deployment `spec.template.spec.imagePullSecrets: [{ name: dockerhub }]`.

### 5. EKS cluster (public/private VPC)

- Worker nodes in **private subnets**
- **Public subnets** tagged `kubernetes.io/role/elb=1`
- **Private subnets** tagged `kubernetes.io/role/internal-elb=1`

### 6. AWS Load Balancer Controller

Install on cluster → verify:

```bash
kubectl get ingressclass
# alb    ingress.k8s.aws/alb
```

### 7. ACM certificate

Request cert for `watchify.sumanmodak.in` in **same region as EKS**.  
Update `ingress.example.yaml` certificate ARN.

### 8. IRSA for upload-service

```bash
eksctl create iamserviceaccount \
  --cluster=YOUR_CLUSTER \
  --region=us-east-1 \
  --namespace=watchify \
  --name=upload-service \
  --role-name=watchify-upload-service \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/watchify-upload-s3 \
  --approve
```

Update role ARN in `upload-service.yaml` if not using eksctl override.

### 9. Apply manifests

```bash
cd deploy/k8s
kubectl apply -f secrets.yaml
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f mongodb.yaml
kubectl wait --for=condition=ready pod/mongodb-0 -n watchify --timeout=180s
kubectl apply -f upload-service.yaml
kubectl apply -f user-service.yaml
kubectl apply -f watch-service.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.example.yaml
```

### 10. DNS

Route 53 A/alias: `watchify.sumanmodak.in` → ALB hostname (from `kubectl get ingress -n watchify`).

### 11. ArgoCD (CD)

Point Application at:

- Repo: `https://github.com/t20suman-glitch/watchify.git`
- Path: `deploy/k8s`
- Branch: `main`

Jenkins CI2 pushes manifest tag updates → ArgoCD syncs.

---

## Verify

```bash
kubectl get pods -n watchify
kubectl get ingress -n watchify
kubectl logs -n watchify deploy/upload-service --tail=20
# expect: "storage":"s3" on /health
curl -s https://watchify.sumanmodak.in
```

---

## Status summary

| Component | Status |
|-----------|--------|
| K8s manifests | Ready |
| ALB Ingress template | Ready — set ACM ARN |
| Docker Hub images `t20suman/*` | **Push images** before deploy |
| GitHub repo URL | Configured in Jenkins |
| S3 bucket | **Pending** — set in `configmap.yaml` |
| JWT_SECRET | **You set** in `secrets.yaml` |
| IRSA + VPC endpoint | **AWS setup** required |
| ACM + Route53 | **AWS setup** required |
| ArgoCD | **Configure** separately |

---

## Optional improvements (post-launch)

- MongoDB Atlas instead of in-cluster Mongo
- MongoDB auth + network policy
- Upload API auth on `/api/uploads`
- CloudWatch log shipping
- HPA for frontend / user / watch services
