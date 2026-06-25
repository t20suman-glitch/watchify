// CI Pipeline 2 — Update K8s manifests with image tag, push to GitHub (ArgoCD syncs CD)
//
// Jenkins job: watchify-ci2-manifest
// Trigger: only from watchify-ci1-build (disable generic triggers)
// Parameter: DOCKER_TAG (passed from CI1)
//
// Required credentials:
//   git-credentials — GitHub PAT with repo push access

pipeline {
  agent any

  parameters {
    string(
      name: 'DOCKER_TAG',
      defaultValue: '',
      description: 'Image tag to write into deploy/k8s manifests (from CI1)'
    )
    string(
      name: 'GIT_BRANCH',
      defaultValue: 'main',
      description: 'Branch to commit manifest updates'
    )
  }

  environment {
    DOCKERHUB_USER = 't20suman'
    GITHUB_REPO = 't20suman-glitch/watchify'
    GIT_AUTHOR_NAME = 'Jenkins CI'
    GIT_AUTHOR_EMAIL = 'jenkins@watchify.local'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
    timeout(time: 15, unit: 'MINUTES')
    timestamps()
  }

  stages {
    stage('Validate Parameter') {
      steps {
        script {
          def tag = params.DOCKER_TAG?.trim()
          if (!tag) {
            error('DOCKER_TAG is required (must be triggered from CI1 with a tag)')
          }
          env.IMAGE_TAG = tag
        }
      }
    }

    stage('Workspace Cleanup') {
      steps {
        cleanWs(deleteDirs: true, disableDeferredWipeout: true)
      }
    }

    stage('Git Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${params.GIT_BRANCH}"]],
          extensions: scm.extensions,
          userRemoteConfigs: scm.userRemoteConfigs
        ])
      }
    }

    stage('Validate Docker Tag') {
      steps {
        script {
          def services = ['user-service', 'upload-service', 'watch-service', 'frontend']
          echo "=== Image tag for this deployment: ${env.IMAGE_TAG} ==="
          services.each { svc ->
            echo "  ${env.DOCKERHUB_USER}/${svc}:${env.IMAGE_TAG}"
          }
        }
      }
    }

    stage('Update Kubernetes Manifests') {
      steps {
        sh '''
          chmod +x deploy/jenkins/scripts/update-k8s-images.sh
          DOCKERHUB_USER=${DOCKERHUB_USER} deploy/jenkins/scripts/update-k8s-images.sh "${IMAGE_TAG}" "${DOCKERHUB_USER}"
        '''
      }
    }

    stage('Push Manifest Changes to GitHub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'git-credentials',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_TOKEN'
        )]) {
          script {
            sh '''
              set -e
              git config user.name "${GIT_AUTHOR_NAME}"
              git config user.email "${GIT_AUTHOR_EMAIL}"

              if git diff --quiet deploy/k8s/; then
                echo "No manifest changes — skipping commit"
                exit 0
              fi

              git add deploy/k8s/user-service.yaml \
                      deploy/k8s/upload-service.yaml \
                      deploy/k8s/watch-service.yaml \
                      deploy/k8s/frontend.yaml

              git commit -m "chore(k8s): bump images to ${IMAGE_TAG} [jenkins]"
            '''
            def repoPath = env.GITHUB_REPO
            sh """
              git push https://\${GIT_USER}:\${GIT_TOKEN}@github.com/${repoPath}.git HEAD:${params.GIT_BRANCH}
            """
          }
        }
        echo 'Manifests pushed — ArgoCD will sync the cluster'
      }
    }
  }

  post {
    success {
      echo "CI2 complete — deploy/k8s images set to ${env.IMAGE_TAG}"
    }
  }
}
