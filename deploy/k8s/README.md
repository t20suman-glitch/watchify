# Kubernetes manifests — Watchify (EKS + S3)

**Repo:** https://github.com/t20suman-glitch/watchify.git  
**Docker Hub:** `t20suman/<service>:<tag>`

Full checklist: [../EKS-DEPLOY.md](../EKS-DEPLOY.md)  
**End-to-end guide (Jenkins → EKS → deploy):** [../EKS-END-TO-END.md](../EKS-END-TO-END.md)

All manifests live in this single folder (no subdirectories).

- **MongoDB** — StatefulSet, 1 replica, headless Service, 20Gi PVC
- **Upload storage** — AWS S3 via IRSA + VPC Gateway endpoint
- **Frontend** — ClusterIP :3000; **ALB** exposes :443 → Service :3000
- **Auth** — `JWT_SECRET` in Secret

## Files

| File | Contents |
|------|----------|
| `namespace.yaml` | `watchify` namespace |
| `configmap.yaml` | Env, Mongo URIs, S3 settings |
| `secrets.example.yaml` | JWT template (copy to `secrets.yaml`) |
| `mongodb.yaml` | Mongo Service + StatefulSet |
| `user-service.yaml` | Deployment + Service |
| `upload-service.yaml` | ServiceAccount (IRSA) + Deployment + Service |
| `watch-service.yaml` | Deployment + Service |
| `frontend.yaml` | Deployment + Service |
| `ingress.example.yaml` | **ALB** Ingress for EKS |
| `iam-upload-s3-policy.example.json` | IAM policy for IRSA |
| `bucket-policy-vpce.example.json` | Bucket policy for private VPC endpoint |

## Images (Docker Hub)

```
t20suman/user-service:<tag>
t20suman/upload-service:<tag>
t20suman/watch-service:<tag>
t20suman/frontend:<tag>
```

Jenkins CI2 updates tags in YAML after CI1 push. Initial deploy: push `latest` or a version tag and match manifests.

## Before apply (EKS)

1. Set **`AWS_S3_BUCKET`** in `configmap.yaml` (when bucket exists)
2. Replace **`ACCOUNT_ID`** in `upload-service.yaml` (IRSA role ARN)
3. Replace **ACM certificate ARN** in `ingress.example.yaml`
4. S3 Gateway VPC endpoint + IRSA — see [../EKS-DEPLOY.md](../EKS-DEPLOY.md)
5. Push images to **Docker Hub** (`t20suman/*`)
6. `secrets.yaml` with `JWT_SECRET`

## Apply

```bash
cd deploy/k8s
cp secrets.example.yaml secrets.yaml   # set JWT_SECRET — do not commit
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

## Verify

```bash
kubectl get pods -n watchify
kubectl get ingress -n watchify
kubectl logs -n watchify deploy/upload-service --tail=20
```

## Scale notes

| Service | Replicas |
|---------|----------|
| user-service | 2 |
| watch-service | 2 |
| frontend | 2 |
| upload-service | 2 |
| mongodb | 1 |

## Ingress (ALB)

Uses `ingressClassName: alb` — **not** nginx. Requires AWS Load Balancer Controller + ACM cert.

See [../EKS-DEPLOY.md](../EKS-DEPLOY.md) for public/private subnet setup.

## Jenkins CI

Build/push images and bump manifest tags — [../jenkins/README.md](../jenkins/README.md).

## Atlas (optional)

Patch Mongo URIs in `configmap.yaml` or store in Secret.
