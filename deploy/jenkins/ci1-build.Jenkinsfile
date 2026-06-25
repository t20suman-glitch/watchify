// CI Pipeline 1 — Build, scan, push images to Docker Hub, trigger CI2
//
// Jenkins job: watchify-ci1-build
// Parameter: DOCKER_TAG (e.g. v2.1)
//
// Required Jenkins credentials (IDs — edit below):
//   dockerhub          — Username with password (Docker Hub)
//   git-credentials    — optional; SCM job config usually handles checkout
//
// SonarQube server named "SonarQube" in Jenkins global config (with token).
//
// Required tools/plugins: git, docker, trivy, dependency-check, sonarqube-scanner

pipeline {
  agent any

  parameters {
    string(
      name: 'DOCKER_TAG',
      defaultValue: '',
      description: 'Docker image tag applied to all services (e.g. v2.1). Required.'
    )
    string(
      name: 'GIT_BRANCH',
      defaultValue: 'main',
      description: 'Branch to build from'
    )
  }

  environment {
    DOCKERHUB_USER = 't20suman'
    GITHUB_REPO = 't20suman-glitch/watchify'
    CI2_JOB_NAME = 'watchify-ci2-manifest'
    SONAR_PROJECT_KEY = 'watchify'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    timeout(time: 60, unit: 'MINUTES')
    timestamps()
  }

  stages {
    stage('Validate Parameter') {
      steps {
        script {
          def tag = params.DOCKER_TAG?.trim()
          if (!tag) {
            error('DOCKER_TAG parameter is required (e.g. v2.1)')
          }
          if (!(tag ==~ /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/)) {
            error("Invalid DOCKER_TAG: ${tag}")
          }
          env.IMAGE_TAG = tag
          echo "Building and pushing images with tag: ${env.IMAGE_TAG}"
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

    stage('Trivy Filesystem Scan') {
      steps {
        sh '''
          set -e
          trivy fs --exit-code 1 --severity HIGH,CRITICAL \
            --skip-dirs node_modules,.next,dist,uploads \
            .
        '''
      }
    }

    stage('OWASP Dependency Check') {
      steps {
        dependencyCheck additionalArguments: '''
          --scan services/user-service
          --scan services/upload-service
          --scan services/watch-service
          --scan frontend
          --format ALL
          --failOnCVSS 7
          --suppression deploy/jenkins/dependency-check-suppression.xml
        ''', odcInstallation: 'dependency-check'
        dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
      }
    }

    stage('SonarQube Code Analysis') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY}'
        }
      }
    }

    stage('SonarQube Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        script {
          def services = [
            [name: 'user-service',   context: 'services/user-service'],
            [name: 'upload-service', context: 'services/upload-service'],
            [name: 'watch-service',  context: 'services/watch-service'],
            [name: 'frontend',       context: 'frontend']
          ]
          services.each { svc ->
            def image = "${env.DOCKERHUB_USER}/${svc.name}:${env.IMAGE_TAG}"
            sh """
              docker build -t ${image} ./${svc.context}
              docker tag ${image} ${env.DOCKERHUB_USER}/${svc.name}:latest
            """
            echo "Built ${image}"
          }
        }
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'DH_USER',
          passwordVariable: 'DH_PASS'
        )]) {
          sh '''
            set -e
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
          '''
          script {
            def services = ['user-service', 'upload-service', 'watch-service', 'frontend']
            services.each { svc ->
              sh """
                docker push ${env.DOCKERHUB_USER}/${svc}:${env.IMAGE_TAG}
                docker push ${env.DOCKERHUB_USER}/${svc}:latest
              """
            }
          }
        }
      }
    }

    stage('Trigger CI2 Manifest Update') {
      steps {
        script {
          build job: env.CI2_JOB_NAME,
            parameters: [
              string(name: 'DOCKER_TAG', value: env.IMAGE_TAG),
              string(name: 'GIT_BRANCH', value: params.GIT_BRANCH)
            ],
            wait: false,
            propagate: false
        }
        echo "Triggered ${env.CI2_JOB_NAME} with DOCKER_TAG=${env.IMAGE_TAG}"
      }
    }
  }

  post {
    success {
      echo "CI1 complete — images pushed as tag ${env.IMAGE_TAG}"
    }
    failure {
      echo 'CI1 failed — CI2 will not be triggered'
    }
    always {
      sh 'docker logout || true'
    }
  }
}
