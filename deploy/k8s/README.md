# Kubernetes manifests — Watchify

Matches current code and `docker-compose.prod.yml` defaults:

- **MongoDB** — StatefulSet, 1 replica, headless Service, PVC per pod
- **Upload storage** — `STORAGE_PROVIDER=local` + PVC (`upload-data`)
- **S3** — stub in code; switch to S3 + IRSA after implementing `s3StorageProvider.js`
- **Logging** — `NODE_ENV=production`, `LOG_LEVEL` from ConfigMap (Winston)
- **Auth** — `JWT_SECRET` in Secret (user-service + watch-service)

## Layout

```
deploy/k8s/
├── namespace.yaml
├── configmap.yaml
├── secrets.example.yaml
├── ingress.example.yaml
├── mongodb/
├── user-service/
├── upload-service/      # includes PVC for local uploads
├── watch-service/
└── frontend/
```

## Build images

```bash
docker build -t watchify/user-service:latest ./services/user-service
docker build -t watchify/upload-service:latest ./services/upload-service
docker build -t watchify/watch-service:latest ./services/watch-service
docker build -t watchify/frontend:latest ./frontend
```

Push to your registry and update `image:` fields if not using local cluster images.

## Apply

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
cp secrets.example.yaml secrets.yaml   # set JWT_SECRET
kubectl apply -f secrets.yaml

kubectl apply -f mongodb/
kubectl wait --for=condition=ready pod/mongodb-0 -n watchify --timeout=180s

kubectl apply -f upload-service/       # PVC + deployment
kubectl apply -f user-service/
kubectl apply -f watch-service/
kubectl apply -f frontend/

# optional — after ingress-nginx + cert-manager
kubectl apply -f ingress.example.yaml
```

## Verify

```bash
kubectl get pods -n watchify
kubectl logs -n watchify deploy/user-service --tail=20

kubectl port-forward -n watchify svc/frontend 3000:3000
```

## Public vs internal

| Service | Exposure |
|---------|----------|
| frontend | Ingress `/` |
| upload-service | Optional Ingress `/api/uploads` |
| user-service | ClusterIP only |
| watch-service | ClusterIP only |
| MongoDB | ClusterIP headless only |

## MongoDB connection

```text
mongodb://mongodb-0.mongodb:27017/<database>
```

Databases: `user_service`, `upload_service`, `watch_service`

## Namespace delete

`kubectl delete namespace watchify` removes PVCs and Mongo/upload data. S3 files (if used later) are unaffected.

## Atlas (optional)

Edit `configmap.yaml` URIs to `mongodb+srv://...` or patch before apply.

## Scale notes

| Service | Replicas | Note |
|---------|----------|------|
| user-service | 2 | Stateless |
| watch-service | 2 | Stateless |
| frontend | 2 | Stateless |
| upload-service | **1** | Required for local PVC |
| mongodb | **1** | Not a replica set |
