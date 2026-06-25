# Jenkins CI — Watchify

Two pipelines: **CI1** builds and pushes images; **CI2** updates K8s manifests and pushes to GitHub. **ArgoCD** handles CD (not configured here).

## Pipelines

| Job | File | Trigger | Parameter |
|-----|------|---------|-----------|
| `watchify-ci1-build` | `ci1-build.Jenkinsfile` | Manual / SCM | `DOCKER_TAG` (e.g. `v2.1`) |
| `watchify-ci2-manifest` | `ci2-manifest.Jenkinsfile` | **Only CI1** | `DOCKER_TAG` (from CI1) |

## CI1 stages

1. **Validate Parameter** — `DOCKER_TAG` required
2. **Workspace Cleanup**
3. **Git Checkout**
4. **Trivy Filesystem Scan** — `HIGH,CRITICAL`, fail on findings
5. **OWASP Dependency Check** — all `package.json` projects, CVSS ≥ 7 fails
6. **SonarQube Code Analysis**
7. **SonarQube Quality Gate** — abort if gate fails
8. **Build Docker Images** — user-service, upload-service, watch-service, frontend
9. **Push to Docker Hub** — tag + `latest`
10. **Trigger CI2** — passes `DOCKER_TAG`

## CI2 stages

1. **Validate Parameter**
2. **Workspace Cleanup**
3. **Git Checkout**
4. **Validate Docker Tag** — prints expected images
5. **Update Kubernetes Manifests** — `deploy/k8s/*.yaml` image tags
6. **Push to GitHub** — commit `[jenkins] bump images to <tag>`

## Image naming

```
t20suman/user-service:<DOCKER_TAG>
t20suman/upload-service:<DOCKER_TAG>
t20suman/watch-service:<DOCKER_TAG>
t20suman/frontend:<DOCKER_TAG>
```

GitHub repo: **https://github.com/t20suman-glitch/watchify.git**

## Jenkins setup

### Plugins

- Pipeline
- Git
- Docker Pipeline (optional)
- OWASP Dependency-Check
- SonarQube Scanner
- Timestamper

### Global tools (Manage Jenkins → Tools)

| Tool | Name in Jenkinsfile |
|------|---------------------|
| SonarQube Scanner | `sonar-scanner` on PATH or SonarQube Scanner installation |
| OWASP Dependency-Check | `dependency-check` |
| Trivy | on agent PATH (`trivy`) |
| Docker | on agent PATH |

### SonarQube

1. Manage Jenkins → Configure System → SonarQube servers → name: `SonarQube`
2. Credential: server authentication token on the SonarQube server entry
3. Project key: `watchify` (see root `sonar-project.properties`)

### Credentials (Manage Jenkins → Credentials)

| ID | Type | Used for |
|----|------|----------|
| `dockerhub` | Username + password | Docker Hub login (CI1) |
| `git-credentials` | Username + password | GitHub PAT (CI2 push; optional CI1) |

SonarQube token is configured on the SonarQube server entry in Jenkins (Manage Jenkins → SonarQube servers).

GitHub PAT needs `repo` scope for CI2 manifest push.

### Create jobs

**CI1 — Pipeline job `watchify-ci1-build`**

- Definition: Pipeline script from SCM
- Script path: `deploy/jenkins/ci1-build.Jenkinsfile`
- This project is parameterized: ✓ (`DOCKER_TAG`, `GIT_BRANCH`)
- Do not trigger CI2 on timer

**CI2 — Pipeline job `watchify-ci2-manifest`**

- Definition: Pipeline script from SCM
- Script path: `deploy/jenkins/ci2-manifest.Jenkinsfile`
- Parameterized: ✓ (receives `DOCKER_TAG` from CI1)
- **Build after other projects are built**: uncheck
- **Disable** GitHub webhook / poll SCM — trigger only from CI1
- In job config → Build Triggers: leave empty (only upstream `build job:` from CI1)

Optional: use [Generic Webhook Trigger](https://plugins.jenkins.io/generic-webhook-trigger/) disabled; or Pipeline job property `properties([pipelineTriggers([])])` in Jenkinsfile (already no SCM trigger in CI2 file).

### Agent requirements

Linux agent with:

- Docker (build + push)
- `trivy` CLI
- `git`
- Network to Docker Hub, GitHub, SonarQube

## Manual test

```bash
# CI1 — Build with Parameters: DOCKER_TAG=v2.1

# CI2 — verify script locally
chmod +x deploy/jenkins/scripts/update-k8s-images.sh
./deploy/jenkins/scripts/update-k8s-images.sh v2.1 watchify
```

## ArgoCD (CD — outside Jenkins)

Point ArgoCD Application at `deploy/k8s` (or a Git path). After CI2 pushes manifest tag changes, ArgoCD syncs EKS automatically if auto-sync is enabled.

## Customize

| Variable | Location | Default |
|----------|----------|---------|
| `DOCKERHUB_USER` | Both Jenkinsfiles `environment` | `t20suman` |
| `GITHUB_REPO` | CI2 Jenkinsfile | `t20suman-glitch/watchify` |
| `CI2_JOB_NAME` | CI1 Jenkinsfile | `watchify-ci2-manifest` |
| OWASP CVSS fail threshold | CI1 `additionalArguments` | `7` |
| Trivy severity | CI1 stage | `HIGH,CRITICAL` |
