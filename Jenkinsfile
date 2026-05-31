pipeline {
    agent any

    environment {
        REGISTRY      = 'powerhub'
        NAMESPACE     = 'clonecloud-main'
        HELM_RELEASE  = 'clonecloud'
        SCAN_REPORT   = 'security-report.txt'
        APP_DIR       = 'powerhub'
    }

    stages {

        // ─────────────────────────────────────────
        // STAGE 1: Checkout PowerHub source code
        // ─────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 1/8 — Source Checkout                 ║'
                echo '╚══════════════════════════════════════════════╝'
                sh 'rm -rf ${APP_DIR} || true'
                sh 'git clone https://github.com/Abhishek-1352/PowerHub.git ${APP_DIR}'
                sh 'echo "Cloned PowerHub @ commit: $(cd ${APP_DIR} && git rev-parse --short HEAD)"'

                // Inject production env overrides (Dockerfile ARG overrides baseURL)
                sh '''
                    # Fix the hardcoded Render URL in api.js
                    sed -i 's|baseURL: "https://powerhub-gnwx.onrender.com"|baseURL: import.meta.env.VITE_API_URL \\|\\| ""|' \
                        ${APP_DIR}/client/src/api.js || true
                '''

                // Copy our production Dockerfiles and nginx config
                sh '''
                    cp powerhub/server/Dockerfile   ${APP_DIR}/server/Dockerfile
                    cp powerhub/server/.dockerignore ${APP_DIR}/server/.dockerignore
                    cp powerhub/client/Dockerfile   ${APP_DIR}/client/Dockerfile
                    cp powerhub/client/.dockerignore ${APP_DIR}/client/.dockerignore
                    cp powerhub/client/nginx.conf   ${APP_DIR}/client/nginx.conf
                '''
            }
        }

        // ─────────────────────────────────────────
        // STAGE 2: Install dependencies & build
        // ─────────────────────────────────────────
        stage('Dependency Install & Build') {
            parallel {
                stage('Backend: npm install') {
                    steps {
                        echo 'Stage 2a — Installing PowerHub backend dependencies...'
                        dir("${APP_DIR}/server") {
                            sh 'npm ci --omit=dev'
                        }
                    }
                }
                stage('Frontend: npm install + build') {
                    steps {
                        echo 'Stage 2b — Installing PowerHub frontend dependencies and building...'
                        dir("${APP_DIR}/client") {
                            sh 'npm ci'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 3: Security Scanning
        // ─────────────────────────────────────────
        stage('Security Scanning') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 3/8 — Security Scanning               ║'
                echo '╚══════════════════════════════════════════════╝'
                sh """
                    echo "=========================================="  > ${SCAN_REPORT}
                    echo "  POWERHUB DEVSECOPS SECURITY SCAN REPORT"  >> ${SCAN_REPORT}
                    echo "  Generated: \$(date)"                        >> ${SCAN_REPORT}
                    echo "=========================================="  >> ${SCAN_REPORT}
                    echo ""                                            >> ${SCAN_REPORT}

                    echo "── npm audit: Backend ────────────────────" >> ${SCAN_REPORT}
                """

                dir("${APP_DIR}/server") {
                    sh '''
                        npm audit --audit-level=moderate --json 2>/dev/null | \
                            node -e "
                                const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
                                const m=d.metadata||{};
                                console.log('Critical: ' + (m.vulnerabilities?.critical||0));
                                console.log('High:     ' + (m.vulnerabilities?.high||0));
                                console.log('Medium:   ' + (m.vulnerabilities?.moderate||0));
                                console.log('Low:      ' + (m.vulnerabilities?.low||0));
                            " 2>/dev/null || npm audit --audit-level=high || true
                    '''
                }

                sh "echo '' >> ${SCAN_REPORT}"
                sh "echo '── npm audit: Frontend ────────────────────' >> ${SCAN_REPORT}"

                dir("${APP_DIR}/client") {
                    sh '''
                        npm audit --audit-level=moderate --json 2>/dev/null | \
                            node -e "
                                const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
                                const m=d.metadata||{};
                                console.log('Critical: ' + (m.vulnerabilities?.critical||0));
                                console.log('High:     ' + (m.vulnerabilities?.high||0));
                                console.log('Medium:   ' + (m.vulnerabilities?.moderate||0));
                                console.log('Low:      ' + (m.vulnerabilities?.low||0));
                            " 2>/dev/null || npm audit --audit-level=high || true
                    '''
                }

                sh """
                    echo ""                                                      >> ${SCAN_REPORT}
                    echo "── Trivy Container Scan ──────────────────────────"   >> ${SCAN_REPORT}
                    if command -v trivy > /dev/null 2>&1; then
                        echo "Running Trivy filesystem scan..."                 >> ${SCAN_REPORT}
                        trivy fs . --severity HIGH,CRITICAL --no-progress      >> ${SCAN_REPORT} || true
                    else
                        echo "[INFO] Trivy not installed on this agent."        >> ${SCAN_REPORT}
                        echo "Install: https://aquasecurity.github.io/trivy/"  >> ${SCAN_REPORT}
                        echo "Status: Skipped (images will be scanned post-push if registry scanning is enabled)" >> ${SCAN_REPORT}
                    fi
                    echo ""                                                      >> ${SCAN_REPORT}
                    echo "Scan complete. See full report above."                >> ${SCAN_REPORT}
                    cat ${SCAN_REPORT}
                """

                // Archive security report as Jenkins build artifact
                archiveArtifacts artifacts: "${SCAN_REPORT}", allowEmptyArchive: true
            }
        }

        // ─────────────────────────────────────────
        // STAGE 4: Docker Build
        // ─────────────────────────────────────────
        stage('Docker Build') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 4/8 — Docker Build                    ║'
                echo '╚══════════════════════════════════════════════╝'
                sh "docker build -t ${REGISTRY}/backend:latest  ./${APP_DIR}/server"
                sh "docker build -t ${REGISTRY}/frontend:latest ./${APP_DIR}/client"
                sh 'echo "Docker images built successfully."'
                sh 'docker images | grep powerhub'
            }
        }

        // ─────────────────────────────────────────
        // STAGE 5: Load images into Kind cluster
        // ─────────────────────────────────────────
        stage('Kind Load') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 5/8 — Kind Cluster Image Load         ║'
                echo '╚══════════════════════════════════════════════╝'
                sh """
                    # Ensure Kind cluster exists
                    if ! kind get clusters 2>/dev/null | grep -q 'clonecloud'; then
                        echo 'Creating Kind cluster clonecloud...'
                        kind create cluster --config kind-config.yaml
                    fi

                    kind load docker-image ${REGISTRY}/backend:latest  --name clonecloud
                    kind load docker-image ${REGISTRY}/frontend:latest --name clonecloud
                    echo '[IMPORT SUCCESS] Both images loaded into Kind cluster clonecloud.'
                """
            }
        }

        // ─────────────────────────────────────────
        // STAGE 6: Helm Deploy
        // ─────────────────────────────────────────
        stage('Helm Deploy') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 6/8 — Helm Deploy to Kubernetes       ║'
                echo '╚══════════════════════════════════════════════╝'
                sh "kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"
                sh """
                    helm upgrade --install ${HELM_RELEASE} ./helm/clonecloud \\
                        --namespace ${NAMESPACE} \\
                        --set backend.image=${REGISTRY}/backend \\
                        --set frontend.image=${REGISTRY}/frontend \\
                        --set backend.tag=latest \\
                        --set frontend.tag=latest \\
                        --values ./helm/clonecloud/values.yaml \\
                        --wait --timeout 3m0s
                """
            }
        }

        // ─────────────────────────────────────────
        // STAGE 7: Verification
        // ─────────────────────────────────────────
        stage('Verification') {
            steps {
                echo '╔══════════════════════════════════════════════╗'
                echo '║  Stage 7/8 — Deployment Verification         ║'
                echo '╚══════════════════════════════════════════════╝'
                sh """
                    echo '→ Checking rollout status...'
                    kubectl rollout status deployment/clonecloud-frontend -n ${NAMESPACE} --timeout=90s
                    kubectl rollout status deployment/clonecloud-backend  -n ${NAMESPACE} --timeout=90s

                    echo '→ Active resources in namespace ${NAMESPACE}:'
                    kubectl get all -n ${NAMESPACE}

                    echo '→ Pod health check:'
                    kubectl get pods -n ${NAMESPACE} -o wide
                """
            }
        }

        // ─────────────────────────────────────────
        // STAGE 8: Notification Summary
        // ─────────────────────────────────────────
        stage('Summary') {
            steps {
                echo '╔══════════════════════════════════════════════════════════╗'
                echo '║  Stage 8/8 — Build Summary                              ║'
                echo '╚══════════════════════════════════════════════════════════╝'
                sh """
                    echo ""
                    echo "  ✅ PowerHub deployed successfully to Kubernetes"
                    echo "  🌐 Frontend:   http://localhost:30080"
                    echo "  🔌 Backend:    kubectl port-forward svc/clonecloud-backend-service 5000:5000 -n ${NAMESPACE}"
                    echo "  📊 Prometheus: http://localhost:9090"
                    echo "  📈 Grafana:    http://localhost:3001"
                    echo ""
                """
            }
        }
    }

    post {
        success {
            echo '✅ PowerHub DevSecOps Pipeline — SUCCESS'
        }
        failure {
            echo '❌ Pipeline FAILED — Check stage logs above for details'
        }
        always {
            echo 'Pipeline finished. Security report archived as build artifact.'
        }
    }
}
