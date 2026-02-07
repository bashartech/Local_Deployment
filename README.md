
## Phase 4: Local Kubernetes Deployment (Minikube, Helm Charts, kubectl-ai, Kagent, Docker Desktop, and Gordon)

### Objective
Deploy the Todo Chatbot on a local Kubernetes cluster using Minikube, Helm Charts with proper authentication flow, MCP server integration, and secure secret management.

### Technology Stack
- Containerization: Docker (Docker Desktop)
- Docker AI Agent: Docker AI Agent (Gordon)
- Orchestration: Kubernetes (Minikube)
- Package Manager: Helm Charts
- AI DevOps: kubectl-ai and Kagent
- Application: Phase III Todo Chatbot

### Features Implemented
- ✅ Proper authentication flow with session establishment before redirects
- ✅ Google OAuth integration with correct callback URLs
- ✅ MCP server integration with stdio communication
- ✅ LightningCSS compatibility in Docker builds
- ✅ JWT token validation between services
- ✅ Secure secret management using Kubernetes secrets
- ✅ Proper service-to-service communication in Kubernetes
- ✅ Ingress configuration for external access
- ✅ Health checks and readiness probes
- ✅ Environment-specific configurations

### Deployment Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   User Browser  │────│   NGINX Ingress  │────│   Frontend Pod   │
│                 │    │                  │    │                  │
│ http://todo.local│    │  todo.local      │    │  Port 3000       │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                │                        │
                                │                        │
                                │               ┌──────────────────┐
                                │               │   Backend Pod    │
                                └──────────────▶│                  │
                                                │  Port 8000       │
                                                └──────────────────┘
                                                        │
                                                        │
                                                ┌──────────────────┐
                                                │   Neon Database  │
                                                │                  │
                                                │  PostgreSQL      │
                                                └──────────────────┘
```

### Prerequisites
1. Docker Desktop with Kubernetes enabled OR Minikube
2. Helm 3.x
3. kubectl
4. Node.js 18+ (for frontend development)
5. Python 3.11+ (for backend development)

### Deployment Steps

#### 1. Start Minikube
```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=40g

# Set Docker environment to Minikube
eval $(minikube docker-env)  # On Linux/Mac
minikube docker-env | Invoke-Expression  # On Windows PowerShell
```

#### 2. Build Docker Images
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t todo-frontend:1.0 .

# Build backend image with MCP server integration
docker build -f Dockerfile.backend -t todo-backend:1.0 .
```

#### 3. Create Kubernetes Namespace
```bash
kubectl create namespace todo-chatbot --dry-run=client -o yaml | kubectl apply -f -
```

#### 4. Create Secrets (Important: Do not commit these to Git!)
```bash
# Create frontend secrets
kubectl create secret generic todo-frontend-env \
  --from-literal=NEXT_PUBLIC_BETTER_AUTH_URL="http://todo.local" \
  --from-literal=NEXT_PUBLIC_BETTER_AUTH_SECRET="e0989jhfgjhfgh0" \
  --from-literal=NEXT_PUBLIC_FRONTEND_URL="http://todo.local" \
  --from-literal=NEXT_PUBLIC_BACKEND_URL="http://todo.local/api" \
  --from-literal=GOOGLE_CLIENT_ID="your-google-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --from-literal=NEXT_PUBLIC_MCP_SERVER_URL="http://todo.local/mcp" \
  -n todo-chatbot

# Create backend secrets
kubectl create secret generic todo-backend-env \
  --from-literal=BETTER_AUTH_URL="http://todo.local" \
  --from-literal=BETTER_AUTH_SECRET="e8iohu87098789jhm0" \
  --from-literal=DATABASE_URL="your-db-url" \
  --from-literal=GEMINI_API_KEY="your-api-key" \
  --from-literal=GOOGLE_CLIENT_ID="your-google-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  -n todo-chatbot
```

#### 5. Install NGINX Ingress Controller
```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

#### 6. Deploy with Helm
```bash
# Navigate to helm charts directory
cd helm-charts

# Install the Helm chart
helm install todo-chatbot-release todo-chatbot \
  --namespace todo-chatbot \
  --create-namespace \
  --set frontend.image.tag="1.0" \
  --set backend.image.tag="1.0"
```

#### 7. Access the Application
```bash
# Add to hosts file (run as administrator)
echo "$(minikube ip) todo.local" >> /etc/hosts  # On Linux/Mac
echo "$(minikube ip) todo.local" >> C:\Windows\System32\drivers\etc\hosts  # On Windows

# Access the application
start http://todo.local  # On Mac
start http://todo.local  # On Windows (in command prompt)
xdg-open http://todo.local  # On Linux
```

### Key Solutions Implemented

#### 1. Authentication Flow Fix
- Fixed login/signup redirect issues by ensuring proper session establishment before redirecting
- Updated JWT middleware to work properly in Kubernetes environment
- Corrected Google OAuth callback URLs for internal service communication

#### 2. LightningCSS Compatibility
- Added build tools (Python, make, g++, build-essential) to Dockerfile
- Included Rust compiler for LightningCSS compilation in container
- Set proper environment variables for building from source

#### 3. Service Communication
- Configured proper internal service names for inter-service communication
- Updated JWT validation to use internal service names for JWKS endpoint
- Fixed environment variables for Kubernetes service discovery

#### 4. MCP Server Integration
- Integrated MCP server as part of backend process using stdio communication
- Configured proper routing for MCP endpoints through ingress
- Ensured MCP server runs as part of backend container

#### 5. Secure Secret Management
- Moved all sensitive data to Kubernetes secrets
- Removed hardcoded secrets from configuration files
- Implemented proper secret mounting in deployments

### Common Issues and Solutions

#### 1. LightningCSS Binary Issues
**Problem**: LightningCSS binaries not available for container platform
**Solution**: Install build tools and force compilation from source

#### 2. Authentication Token Validation
**Problem**: JWT tokens not validated properly between services
**Solution**: Update JWKS endpoint to use internal service name

#### 3. Port Binding and Service Discovery
**Problem**: Services not communicating properly in Kubernetes
**Solution**: Use internal DNS names for service-to-service communication

#### 4. Google OAuth Redirect Issues
**Problem**: Google sign-in not redirecting properly
**Solution**: Use proper callback URLs and ensure session establishment

### Management Commands

#### Update Images
```bash
# Build new images
docker build -f Dockerfile.frontend -t todo-frontend:1.1 .
docker build -f Dockerfile.backend -t todo-backend:1.1 .

# Update deployments
kubectl set image deployment/todo-chatbot-frontend -n todo-chatbot todo-chatbot-frontend=todo-frontend:1.1
kubectl set image deployment/todo-chatbot-backend -n todo-chatbot todo-chatbot-backend=todo-backend:1.1
```

#### Check Status
```bash
# Check pods
kubectl get pods -n todo-chatbot

# Check services
kubectl get svc -n todo-chatbot

# Check ingress
kubectl get ingress -n todo-chatbot

# Check logs
kubectl logs -n todo-chatbot -l app=frontend
kubectl logs -n todo-chatbot -l app=backend
```

#### Troubleshooting
```bash
# Port forward for local access during troubleshooting
kubectl port-forward -n todo-chatbot svc/todo-chatbot-frontend 3000:3000
kubectl port-forward -n todo-chatbot svc/todo-chatbot-backend 8000:8000

# Check if services are accessible from within cluster
kubectl run test-pod --image=curlimages/curl -it --rm --restart=Never -- curl -I http://todo-chatbot-frontend:3000
kubectl run test-pod --image=curlimages/curl -it --rm --restart=Never -- curl -I http://todo-chatbot-backend:8000
```

### Best Practices Followed
1. Separated secrets from code (never store secrets in values files)
2. Used internal service names for service-to-service communication
3. Implemented proper health checks and readiness probes
4. Configured resource limits and requests
5. Used rolling updates to minimize downtime
6. Implemented proper logging and monitoring approach
7. Secured all sensitive data with Kubernetes secrets

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL or Neon database
- Better Auth configured

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL="your_database_url"
NEXT_PUBLIC_BETTER_AUTH_URL="your_auth_url"
NEXT_PUBLIC_BETTER_AUTH_SECRET="your_auth_secret"
GEMINI_API_KEY="your_gemini_api_key"
MCP_SERVER_URL="http://localhost:3001"
```

4. Run the backend:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```env
NEXT_PUBLIC_BETTER_AUTH_URL="your_auth_url"
NEXT_PUBLIC_BETTER_AUTH_SECRET="your_auth_secret"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

4. Run the development server:
```bash
npm run dev
```

### MCP Server Setup
1. Navigate to the MCP server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Run the MCP server:
```bash
npm start
```

## ChatKit Domain Configuration

For the chat interface to work properly, you need to configure ChatKit domain allowlist:

1. In your ChatKit configuration, add your domain to the allowed origins
2. For local development: `http://localhost:3000`
3. For production: your production domain

## Usage

### Chat Interface
The AI chatbot is available as a floating chat widget on all authenticated pages:
- Click the chat icon in the bottom-right corner
- Type natural language commands to manage tasks
- Examples:
  - "Add a task to buy groceries"
  - "Show me all my tasks"
  - "Mark task #1 as complete"
  - "Delete task #2"

### API Endpoints
- `POST /api/{user_id}/chat` - Chat with the AI agent
- Standard task endpoints remain available from Phase 2

## Security Features
- JWT-based authentication
- User data isolation
- MCP tool authentication
- Rate limiting on chat endpoints
- Input validation and sanitization

## Troubleshooting

### ChatKit Domain Issues
- Ensure your domain is added to the ChatKit allowlist
- Check browser console for CORS errors
- Verify that the ChatKit domain matches your application domain

### Authentication Issues
- Verify JWT tokens are properly configured
- Check that Better Auth is properly set up
- Ensure frontend and backend URLs match

### MCP Server Connectivity
- Verify MCP server is running
- Check that backend can connect to MCP server
- Confirm authentication tokens are properly passed

### Database Issues
- Ensure database connection string is correct
- Run migrations if needed
- Verify database permissions

## API Documentation

### Chat Endpoint
`POST /api/{user_id}/chat`

Request body:
```json
{
  "conversation_id": number, // optional
  "message": "string"
}
```

Response:
```json
{
  "conversation_id": number,
  "response": "string",
  "tool_calls": []
}
```

## Environment Variables

### Backend
- `DATABASE_URL`: Database connection string
- `NEXT_PUBLIC_BETTER_AUTH_URL`: Better Auth URL
- `NEXT_PUBLIC_BETTER_AUTH_SECRET`: Better Auth secret
- `GEMINI_API_KEY`: Gemini API key
- `MCP_SERVER_URL`: MCP server URL

### Frontend
- `NEXT_PUBLIC_BETTER_AUTH_URL`: Better Auth URL
- `NEXT_PUBLIC_BETTER_AUTH_SECRET`: Better Auth secret
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL

## Health Checks
- `/health` - General health check
- `/ready` - Readiness check

## Contributing
See the contributing guidelines in the repository.

## License
MIT License