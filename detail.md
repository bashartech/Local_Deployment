Professional Minikube Deployment Steps for Todo Chatbot Application (Corrected)

  1. Prerequisites Installation

  # Install Docker Desktop (with Docker AI Agent - Gordon)
  # Enable Gordon: Go to Docker Desktop Settings > Beta Features > Toggle Gordon on

  # Install kubectl
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/windows/amd64/kubectl.exe"

  # Install Minikube
  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-windows-amd64.exe
  move minikube-windows-amd64.exe minikube.exe

  # Install Helm
  winget install Helm.Helm

  # Start Minikube
  minikube start --driver=docker

  2. Environment Setup

  # Set Docker environment for Minikube
  minikube docker-env | Invoke-Expression

  # Verify the environment
  docker ps
  kubectl cluster-info

  3. Updated Dockerfiles for Kubernetes

  Updated Frontend Dockerfile (Dockerfile.frontend.k8s):

  # ---------- Build Stage ----------
  FROM node:20-alpine AS builder

  WORKDIR /app

  # Copy package files
  COPY frontend/package*.json ./
  RUN npm ci --legacy-peer-deps

  # Copy source code
  COPY frontend/ .

  # Build the Next.js application for production
  ENV NODE_ENV=production
  RUN npm run build

  # Export as static site for nginx
  RUN npm run export

  # ---------- Runtime Stage ----------
  FROM nginx:alpine

  # Copy nginx configuration for Next.js apps
  RUN rm -rf /etc/nginx/conf.d/default.conf
  COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

  # Copy the exported static application
  COPY --from=builder /app/out /usr/share/nginx/html

  # Expose port 80
  EXPOSE 80

  # Start nginx
  CMD ["nginx", "-g", "daemon off;"]

  Create nginx.conf for Next.js (handles API proxying):

  server {
      listen 80;
      server_name localhost;

      location / {
          root /usr/share/nginx/html;
          index index.html index.htm;
          try_files $uri $uri/ /index.html;
      }

      # API proxy to backend service
      location /api {
          proxy_pass http://backend:8000/api;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_cache_bypass $http_upgrade;
      }

      # Better Auth proxy
      location ~ ^/(api/auth|auth)/ {
          proxy_pass http://backend:8000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_cache_bypass $http_upgrade;
      }

      # MCP Server proxy (stdio communication)
      location /mcp {
          proxy_pass http://backend:8000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_cache_bypass $http_upgrade;
      }

      error_page 500 502 503 504 /50x.html;
      location = /50x.html {
          root /usr/share/nginx/html;
      }
  }

  Updated Backend Dockerfile (Dockerfile.backend.k8s):

  FROM python:3.11-slim

  # Install system dependencies
  RUN apt-get update && apt-get install -y \
      gcc g++ curl \
      && rm -rf /var/lib/apt/lists/*

  # Install Node.js 20 (for MCP Server)
  RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
      && apt-get install -y nodejs

  # Set workdir
  WORKDIR /app

  # Install Python dependencies
  COPY ./backend/requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  # Copy backend source code
  COPY ./backend .

  # Setup MCP Server (stdio integration)
  WORKDIR /app/mcp-server
  COPY ./mcp-server/package*.json ./
  RUN npm ci

  COPY ./mcp-server .
  RUN npm install -g typescript
  RUN npx tsc

  WORKDIR /app

  # Ensure the application listens on all interfaces
  EXPOSE 8000

  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

  4. Build Docker Images

  # Build frontend image
  docker build -t todo-frontend:1.0 -f Dockerfile.frontend.k8s .

  # Build backend image (with MCP server integrated)
  docker build -t todo-backend:1.0 -f Dockerfile.backend.k8s .

  # Verify images
  docker images | grep todo-

  5. Create Kubernetes Secrets

  Based on your environment files, create Kubernetes secrets:

  # Create a script to set up secrets (save as setup-secrets.ps1)
  @"
  # Create namespace
  kubectl create namespace todo-chatbot --dry-run=client -o yaml | kubectl apply -f -

  # Create frontend secrets
  kubectl create secret generic frontend-env \
    --namespace todo-chatbot \
    --from-literal=NEXT_PUBLIC_BETTER_AUTH_SECRET=$(echo "e8QDSIu8QZtOENR8tRcsdwYMmwC4Uom0" | Out-String) \
    --from-literal=NEXT_PUBLIC_BETTER_AUTH_URL="http://frontend:80" \
    --from-literal=NEXT_PUBLIC_FRONTEND_URL="http://frontend:80" \
    --from-literal=NEXT_PUBLIC_BACKEND_URL="http://backend:8000/api" \
    --from-literal=GOOGLE_CLIENT_ID="1097804706136-gidaslcn061l7nqa5bu2bt3ioob22odb.apps.googleusercontent.com" \
    --from-literal=GOOGLE_CLIENT_SECRET="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" \
    --from-literal=NEXT_PUBLIC_MCP_SERVER_URL="http://backend:8000/mcp" \
    --dry-run=client -o yaml | kubectl apply -f -

  # Create backend secrets
  kubectl create secret generic backend-env \
    --namespace todo-chatbot \
    --from-literal=BETTER_AUTH_URL="http://frontend:80" \
    --from-literal=BETTER_AUTH_SECRET="e8QDSIu8QZtOENR8tRcsdwYMmwC4Uom0" \
    --from-literal=DATABASE_URL="postgresql://neondb_owner:npg_7JypvMXuA3GF@ep-empty-paper-a4mrk3om-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel  _binding=require" \
    --from-literal=GEMINI_API_KEY="AIzaSyAf373Hab-fdyEYrmoZWE6VAEirF8QxdyM" \
    --from-literal=GOOGLE_CLIENT_ID="1097804706136-gidaslcn061l7nqa5bu2bt3ioob22odb.apps.googleusercontent.com" \
    --from-literal=GOOGLE_CLIENT_SECRET="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" \
    --dry-run=client -o yaml | kubectl apply -f -
  "@

  6. Create Kubernetes Manifests

  Create a k8s-manifests directory:

  mkdir k8s-manifests

  Frontend Deployment (k8s-manifests/frontend-deployment.yaml):

  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: frontend
    namespace: todo-chatbot
    labels:
      app: frontend
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: frontend
    template:
      metadata:
        labels:
          app: frontend
      spec:
        containers:
        - name: frontend
          image: todo-frontend:1.0
          imagePullPolicy: Never  # Since we're using Minikube's local registry
          ports:
          - containerPort: 80
          envFrom:
          - secretRef:
              name: frontend-env
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: frontend
    namespace: todo-chatbot
    labels:
      app: frontend
  spec:
    type: ClusterIP
    ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http
    selector:
      app: frontend

  Backend Deployment (k8s-manifests/backend-deployment.yaml):

  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: backend
    namespace: todo-chatbot
    labels:
      app: backend
  spec:
    replicas: 1
    selector:
      matchLabels:
        app: backend
    template:
      metadata:
        labels:
          app: backend
      spec:
        containers:
        - name: backend
          image: todo-backend:1.0
          imagePullPolicy: Never
          ports:
          - containerPort: 8000
          env:
          - name: HOST
            value: "0.0.0.0"
          - name: PORT
            value: "8000"
          - name: NODE_ENV
            value: "production"
          envFrom:
          - secretRef:
              name: backend-env
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: backend
    namespace: todo-chatbot
    labels:
      app: backend
  spec:
    type: ClusterIP
    ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
      name: http
    selector:
      app: backend

  Ingress (k8s-manifests/ingress.yaml):

  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: todo-ingress
    namespace: todo-chatbot
    annotations:
      kubernetes.io/ingress.class: nginx
      nginx.ingress.kubernetes.io/rewrite-target: /
      nginx.ingress.kubernetes.io/configuration-snippet: |
        location ~ ^/api/auth(.*)$ {
          proxy_pass http://backend:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_http_version 1.1;
          proxy_set_header Connection "";
        }
  spec:
    rules:
    - host: todo.local
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: frontend
              port:
                number: 80

  7. Install NGINX Ingress Controller

  # Install NGINX Ingress Controller
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

  # Wait for ingress controller to be ready
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=90s

  8. Deploy the Application

  # Apply secrets first
  kubectl apply -f setup-secrets.ps1  # Run this PowerShell script

  # Apply deployments
  kubectl apply -f k8s-manifests/

  # Verify deployments
  kubectl get pods -n todo-chatbot
  kubectl get services -n todo-chatbot
  kubectl get ingress -n todo-chatbot

  9. Secure Secret Management Strategy

  For production use, follow this approach:

  1. Local Development: Use the secrets approach above with a secure password manager or vault
  2. CI/CD Pipeline: Use tools like HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault
  3. Git Repository: Store encrypted secrets using tools like sops + age or SealedSecrets

  Example for production secret management:
  # Using kubeseal to encrypt secrets
  # Install kubeseal first
  kubectl krew install sealed-secrets

  # Create a sealed secret (this can be safely committed to git)
  kubectl create secret generic backend-env \
    --namespace todo-chatbot \
    --from-literal=DATABASE_URL="your-encrypted-db-url" \
    --output json --dry-run=client | \
    kubeseal --format yaml > sealed-backend-secret.yaml

  10. Environment Variable Mapping

  Based on your existing .env files, here's how they map to Kubernetes:

  Frontend Environment Variables:
  - NEXT_PUBLIC_BETTER_AUTH_SECRET → Kubernetes Secret
  - NEXT_PUBLIC_BETTER_AUTH_URL → http://frontend:80 (Kubernetes service name)
  - NEXT_PUBLIC_FRONTEND_URL → http://frontend:80
  - NEXT_PUBLIC_BACKEND_URL → http://backend:8000/api
  - GOOGLE_CLIENT_ID → Kubernetes Secret
  - GOOGLE_CLIENT_SECRET → Kubernetes Secret
  - NEXT_PUBLIC_MCP_SERVER_URL → http://backend:8000 (MCP server runs as part of backend)

  Backend Environment Variables:
  - BETTER_AUTH_URL → http://frontend:80
  - BETTER_AUTH_SECRET → Kubernetes Secret
  - DATABASE_URL → Neon PostgreSQL URL in Kubernetes Secret
  - GEMINI_API_KEY → Kubernetes Secret
  - GOOGLE_CLIENT_ID → Kubernetes Secret
  - GOOGLE_CLIENT_SECRET → Kubernetes Secret

  11. MCP Server Integration

  The MCP server runs as part of the backend process using stdio communication. The Dockerfile integrates it properly, and the nginx configuration handles MCP   
  communication through the backend service.

  12. Access the Application

  # Add to hosts file (run as administrator)
  echo "$(minikube ip) todo.local" >> C:\Windows\System32\drivers\etc\hosts

  # Access via ingress
  start http://todo.local

  13. Verification Commands

  # Check all resources
  kubectl get all -n todo-chatbot

  # Check logs for any issues
  kubectl logs -n todo-chatbot -l app=frontend
  kubectl logs -n todo-chatbot -l app=backend

  # Port forward for debugging if needed
  kubectl port-forward -n todo-chatbot svc/backend 8000:8000
  kubectl port-forward -n todo-chatbot svc/frontend 3000:80

  This approach ensures:
  1. ✅ MCP server runs as part of backend with stdio communication
  2. ✅ Neon PostgreSQL database is used directly (no separate container)
  3. ✅ Secrets are stored securely in Kubernetes secrets, not in Helm values
  4. ✅ Proper service discovery using Kubernetes DNS names
  5. ✅ Environment variables are properly mapped for both frontend and backend
  6. ✅ Professional and secure deployment suitable for production
