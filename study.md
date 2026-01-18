# Docker Desktop & CI/CD Learning Plan

## Overview
This plan will guide you through containerization with Docker and setting up CI/CD with GitHub Actions using a practical Node.js/Express API project with MySQL.

**Estimated Time:** 3-4 hours (hands-on)

---

## Phase 1: Docker Desktop Setup & Fundamentals (30 mins)

### Step 1.1: Install Docker Desktop on Windows 10
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and restart your computer
3. Enable WSL 2 if prompted (Windows Subsystem for Linux)
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

### Step 1.2: Understanding Key Docker Concepts
Before diving in, understand these core concepts:

- **Image**: A blueprint/template (like a class in OOP) - immutable snapshot of your app
- **Container**: A running instance of an image (like an object) - can be started, stopped, deleted
- **Dockerfile**: Instructions to build an image (recipe for your app)
- **Docker Compose**: Tool to define and run multi-container applications (one YAML file to rule them all)
- **Volume**: Persistent data storage that survives container restarts
- **Network**: How containers communicate with each other

### Step 1.3: Essential Docker Commands to Know
```bash
# Image commands
docker images                    # List all images
docker pull <image>             # Download an image
docker rmi <image>              # Remove an image
docker build -t <name> .        # Build image from Dockerfile

# Container commands
docker ps                       # List running containers
docker ps -a                    # List all containers (including stopped)
docker run <image>              # Create and start a container
docker start <container>        # Start a stopped container
docker stop <container>         # Stop a running container
docker rm <container>           # Remove a container
docker logs <container>         # View container logs
docker exec -it <container> sh  # Enter container shell

# Docker Compose commands
docker-compose up               # Start all services
docker-compose up -d            # Start in detached mode (background)
docker-compose down             # Stop and remove all containers
docker-compose ps               # List compose containers
docker-compose logs             # View logs
docker-compose logs -f          # Follow logs in real-time
```

---

## Phase 2: Create the Node.js API Project (45 mins)

### Step 2.1: Project Setup
```bash
mkdir docker-cicd-practice
cd docker-cicd-practice
npm init -y
```

### Step 2.2: Install Dependencies
```bash
npm install express mysql2 dotenv
npm install --save-dev jest supertest nodemon
```

### Step 2.3: Project Structure
Create this folder structure:
```
docker-cicd-practice/
├── src/
│   ├── app.js           # Express app (no server.listen)
│   ├── server.js        # Server entry point
│   ├── db.js            # MySQL connection
│   └── routes/
│       └── users.js     # User routes
├── tests/
│   └── users.test.js    # Jest tests
├── .env                 # Environment variables
├── .env.example         # Example env file
├── .dockerignore        # Files to exclude from Docker
├── Dockerfile           # Instructions to build app image
├── docker-compose.yml   # Multi-container setup
├── package.json
└── .gitignore
```

### Step 2.4: Create Core Files

**package.json** (add these scripts):
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage --detectOpenHandles --forceExit"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"]
  }
}
```

**Key files to create** (let Cursor help generate):
- `src/db.js` - MySQL connection using mysql2 with connection pooling
- `src/app.js` - Express app with routes (export app, don't call listen)
- `src/server.js` - Import app and call listen (for running server)
- `src/routes/users.js` - Simple CRUD routes (GET /users, POST /users, GET /users/:id)
- `tests/users.test.js` - Tests for your routes using supertest and jest

**.env.example**:
```
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=testdb
PORT=3000
NODE_ENV=development
```

**.gitignore**:
```
node_modules/
.env
coverage/
*.log
.DS_Store
```

**.dockerignore**:
```
node_modules
npm-debug.log
.env
.git
.gitignore
coverage/
*.md
```

---

## Phase 3: Dockerize the Application (45 mins)

### Step 3.1: Understanding the Dockerfile

**Dockerfile** - This builds your Node.js app image:
```dockerfile
# Start from official Node.js image (Alpine = smaller size)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (Docker layer caching optimization)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (documentation, doesn't actually publish)
EXPOSE 3000

# Command to run when container starts
CMD ["npm", "start"]
```

**Why this order matters:**
- Docker builds in layers, each instruction = new layer
- Layers are cached - if package.json doesn't change, npm install is skipped
- Copying package.json before source code = faster rebuilds when you only change code

### Step 3.2: Understanding docker-compose.yml

**docker-compose.yml** - Defines multiple services and how they work together:
```yaml
version: '3.8'  # Docker Compose file format version

services:
  # MySQL Database Service
  mysql:
    image: mysql:8.0  # Official MySQL image
    container_name: practice-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: testdb
    ports:
      - "3306:3306"  # Host:Container port mapping
    volumes:
      - mysql-data:/var/lib/mysql  # Persistent data storage
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # Init script
    networks:
      - app-network
    healthcheck:  # Wait until MySQL is ready
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Node.js API Service
  api:
    build:
      context: .  # Build from current directory
      dockerfile: Dockerfile
    container_name: practice-api
    ports:
      - "3000:3000"
    environment:
      DB_HOST: mysql  # Service name = hostname in Docker network
      DB_USER: root
      DB_PASSWORD: rootpassword
      DB_NAME: testdb
      PORT: 3000
      NODE_ENV: production
    depends_on:
      mysql:
        condition: service_healthy  # Wait for MySQL to be healthy
    networks:
      - app-network
    volumes:
      - ./src:/app/src  # Mount source for development (optional)
    restart: unless-stopped

# Named volumes (managed by Docker)
volumes:
  mysql-data:

# Custom network (services can communicate by service name)
networks:
  app-network:
    driver: bridge
```

**Key Concepts Explained:**

1. **Services**: Each container you want to run (mysql, api)
2. **Ports**: `"host:container"` - Access container port 3306 via localhost:3306
3. **Environment**: Variables passed to the container
4. **Volumes**: 
   - Named volumes (`mysql-data`) = Docker-managed persistent storage
   - Bind mounts (`./src:/app/src`) = Mount host folder into container
5. **Networks**: Containers on same network can talk using service names
6. **depends_on**: Control startup order
7. **healthcheck**: Verify service is actually ready (not just started)

### Step 3.3: Create init.sql
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com');
```

### Step 3.4: Build and Run
```bash
# Copy example env file
cp .env.example .env

# Build and start all services
docker-compose up --build

# In another terminal, test the API
curl http://localhost:3000/users

# View logs
docker-compose logs -f api

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Step 3.5: Common Docker Compose Patterns for Your Company

**For PHP projects with Apache/Nginx:**
```yaml
services:
  php-app:
    image: php:8.1-apache
    volumes:
      - ./src:/var/www/html
    ports:
      - "8080:80"
```

**For React frontend:**
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    volumes:
      - ./frontend/src:/app/src
```

**Full stack example (similar to your company stack):**
```yaml
services:
  mysql:
    image: mysql:8.0
    # ... mysql config ...
  
  backend:
    build: ./backend
    depends_on:
      - mysql
    # ... backend config ...
  
  frontend:
    build: ./frontend
    depends_on:
      - backend
    # ... frontend config ...
```

---

## Phase 4: GitHub Actions CI/CD (60 mins)

### Step 4.1: Understanding GitHub Actions Concepts

- **Workflow**: Automated process defined in YAML file
- **Event**: Trigger that starts a workflow (push, pull_request, schedule, etc.)
- **Job**: Set of steps that run on the same runner
- **Step**: Individual task (run a command, use an action)
- **Runner**: Server that runs your workflows (GitHub-hosted or self-hosted)
- **Action**: Reusable unit of code (like a function)

### Step 4.2: Create GitHub Repository
```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/docker-cicd-practice.git
git branch -M main
git push -u origin main
```

### Step 4.3: Create GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

# When to run this workflow
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

# Jobs to run
jobs:
  # Job 1: Run tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest  # GitHub-hosted runner
    
    # Service containers (run alongside job)
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_DATABASE: testdb
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    
    steps:
      # Step 1: Checkout code
      - name: Checkout code
        uses: actions/checkout@v3
      
      # Step 2: Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'  # Cache npm dependencies
      
      # Step 3: Install dependencies
      - name: Install dependencies
        run: npm ci  # ci = clean install (faster, more reliable)
      
      # Step 4: Wait for MySQL
      - name: Wait for MySQL
        run: |
          for i in {1..30}; do
            if mysqladmin ping -h 127.0.0.1 -u root -prootpassword --silent; then
              echo "MySQL is ready"
              exit 0
            fi
            echo "Waiting for MySQL... ($i/30)"
            sleep 2
          done
          echo "MySQL failed to start"
          exit 1
      
      # Step 5: Setup database
      - name: Setup database
        run: mysql -h 127.0.0.1 -u root -prootpassword testdb < init.sql
      
      # Step 6: Run tests
      - name: Run tests
        env:
          DB_HOST: 127.0.0.1
          DB_USER: root
          DB_PASSWORD: rootpassword
          DB_NAME: testdb
          PORT: 3000
          NODE_ENV: test
        run: npm test
      
      # Step 7: Upload coverage
      - name: Upload coverage reports
        uses: actions/upload-artifact@v3
        if: always()  # Run even if tests fail
        with:
          name: coverage-report
          path: coverage/
  
  # Job 2: Build Docker image (runs after test succeeds)
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test  # Only run if test job succeeds
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Build Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: false  # Don't push (no registry configured)
          tags: docker-cicd-practice:${{ github.sha }}
          cache-from: type=gha  # GitHub Actions cache
          cache-to: type=gha,mode=max
      
      - name: Test Docker image
        run: |
          docker run -d --name test-container \
            -e DB_HOST=host.docker.internal \
            -e DB_USER=root \
            -e DB_PASSWORD=rootpassword \
            -e DB_NAME=testdb \
            docker-cicd-practice:${{ github.sha }}
          sleep 5
          docker logs test-container
          docker stop test-container

  # Job 3: Lint and code quality (runs in parallel with test)
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # Add linting if you have it configured
      - name: Check code formatting
        run: |
          echo "Add eslint or prettier here"
          # npm run lint
```

### Step 4.4: Understanding the Workflow

**Key GitHub Actions Concepts:**

1. **`uses:`** - Use a pre-built action from marketplace
   - `actions/checkout@v3` - Checks out your repo
   - `actions/setup-node@v3` - Installs Node.js
   
2. **`run:`** - Execute shell commands
   
3. **`env:`** - Set environment variables for a step or job
   
4. **`if:`** - Conditional execution
   - `if: always()` - Run even if previous steps fail
   - `if: success()` - Only run if previous steps succeed
   
5. **`needs:`** - Job dependencies (controls order)

6. **`services:`** - Run containers alongside your job (perfect for databases)

7. **`cache:`** - Speed up workflows by caching dependencies

8. **`${{ github.sha }}`** - Built-in variables (SHA of commit)

### Step 4.5: Test the Workflow

1. Make a code change in `src/routes/users.js`
2. Add a corresponding test in `tests/users.test.js`
3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add new user endpoint"
   git push
   ```
4. Go to GitHub → Actions tab → Watch your workflow run
5. Click on the workflow to see detailed logs for each step

### Step 4.6: Advanced CI/CD Patterns

**Matrix testing (test multiple Node versions):**
```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
```

**Push Docker image to registry (GitHub Container Registry):**
```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v2
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v4
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
```

**Deploy to server (if you had one):**
```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: |
    # SSH into server and pull new image
    ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

---

## Phase 5: Practical Exercises & Real-World Scenarios (30 mins)

### Exercise 1: Add a New Feature with TDD
1. Write a failing test for `DELETE /users/:id`
2. Watch GitHub Actions fail
3. Implement the feature
4. Push and watch tests pass

### Exercise 2: Multi-Environment Setup
Create `docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      target: development  # Multi-stage build
    volumes:
      - ./src:/app/src  # Hot reload
      - ./tests:/app/tests
    environment:
      NODE_ENV: development
    command: npm run dev  # Use nodemon
```

Run with: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

### Exercise 3: Database Migrations
Add a migration step to your workflow:
```yaml
- name: Run migrations
  run: |
    # Add a migrations folder and script
    npm run migrate
```

### Exercise 4: Prepare a Company Project Template

Create a template `docker-compose.company.yml` for new hires:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-secret}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-app_db}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  php-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.php
    volumes:
      - ./backend:/var/www/html
    ports:
      - "8000:80"
    depends_on:
      - mysql

  node-backend:
    build:
      context: ./node-api
    volumes:
      - ./node-api:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "3001:3000"
    depends_on:
      - php-backend
      - node-backend

volumes:
  mysql-data:
```

With a README for new hires:
```markdown
# Project Setup (New Hire Onboarding)

## Prerequisites
- Docker Desktop installed
- Git installed

## Quick Start
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Run: `docker-compose up`
4. Access:
   - Frontend: http://localhost:3001
   - PHP API: http://localhost:8000
   - Node API: http://localhost:3000
   - MySQL: localhost:3306

No XAMPP needed! Everything runs in containers.
```

---

## Phase 6: Troubleshooting & Best Practices (20 mins)

### Common Docker Issues

**Problem: Port already in use**
```bash
# Find what's using port 3306
netstat -ano | findstr :3306
# Kill the process or change the port in docker-compose.yml
ports:
  - "3307:3306"  # Use different host port
```

**Problem: Container exits immediately**
```bash
# Check logs
docker-compose logs api

# Common causes:
# 1. Application crashes (check logs)
# 2. Database not ready (add healthcheck and depends_on)
# 3. Wrong environment variables
```

**Problem: Changes not reflecting**
```bash
# Rebuild images
docker-compose up --build

# Clear everything and start fresh
docker-compose down -v
docker-compose up --build
```

**Problem: "Cannot connect to MySQL"**
```bash
# Make sure you're using service name as host
DB_HOST=mysql  # Not 'localhost' or '127.0.0.1'

# Check network
docker-compose exec api ping mysql

# Verify MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost
```

### Docker Best Practices

1. **Use .dockerignore** - Exclude unnecessary files
2. **Multi-stage builds** - Smaller production images
3. **Don't run as root** - Add USER instruction
4. **One process per container** - Don't use supervisord
5. **Use specific image tags** - Not `latest`
6. **Health checks** - Ensure containers are actually ready
7. **Named volumes** - For data that should persist
8. **Environment variables** - Never hardcode credentials
9. **Small base images** - Use Alpine when possible
10. **Layer caching** - Copy package.json before source code

### GitHub Actions Best Practices

1. **Use `npm ci`** instead of `npm install` - Faster, more reliable
2. **Cache dependencies** - Speeds up workflows significantly
3. **Matrix builds** - Test multiple versions/environments
4. **Secrets for credentials** - Never commit passwords
5. **Fail fast** - Don't waste time on broken builds
6. **Artifacts for debugging** - Upload logs, coverage reports
7. **Branch protection** - Require checks to pass before merge
8. **Limit workflow runs** - Use path filters to avoid unnecessary runs

---

## Phase 7: Next Steps & Advanced Topics

### Immediate Next Steps
1. ✅ Set up this practice project
2. ✅ Get comfortable with docker-compose commands
3. ✅ Create your first passing CI workflow
4. 📝 Document learnings in a personal wiki/notes
5. 🎯 Apply to one company project (start small)

### Advanced Topics to Explore Later

**Docker:**
- Multi-stage builds for smaller images
- Docker networks deep dive
- Docker secrets for sensitive data
- Custom bridge networks vs. host networking
- Docker BuildKit and build cache optimization
- Health checks and restart policies

**Docker Compose:**
- Override files for different environments
- Scaling services (`docker-compose up --scale api=3`)
- Profiles for conditional service start
- Extension fields for DRY configurations

**GitHub Actions:**
- Reusable workflows (DRY for multiple repos)
- Self-hosted runners (for company servers)
- Deployment strategies (blue-green, canary)
- Automated versioning and releases
- Security scanning (Dependabot, CodeQL)
- Performance testing in CI

**Production Considerations:**
- Container orchestration (Kubernetes basics)
- Monitoring and logging (Prometheus, Grafana, ELK)
- Image scanning for vulnerabilities
- Registry management (Docker Hub, ECR, GCR, GHCR)
- Backup strategies for volumes
- Resource limits and quotas

---

## Checklist for Completion

- [x] Docker Desktop installed and running
- [x] Node.js API project created with Express
- [ ] MySQL connection working
- [ ] Jest tests written and passing locally
- [ ] Dockerfile created and tested
- [ ] docker-compose.yml working (can run full stack)
- [ ] Database initialization script working
- [ ] GitHub repository created
- [ ] GitHub Actions workflow created
- [ ] CI pipeline running successfully
- [ ] Docker image building in CI
- [ ] Coverage reports uploaded
- [ ] Documentation added (README.md)
- [ ] `.env.example` committed (not `.env`)
- [ ] First feature added with TDD approach

---

## Resources for Deep Dive

### Docker
- [Official Docker Documentation](https://docs.docker.com/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)

### Testing
- [Jest Documentation](https://jestjs.io/)
- [Supertest for API testing](https://github.com/visionmedia/supertest)

---

## Final Notes

**Remember:**
- Start the MySQL container first, wait for it to be healthy
- Use service names (not localhost) when containers talk to each other
- Environment variables are your friend - never hardcode
- Logs are gold - always check them when debugging
- GitHub Actions is free for public repos, 2000 min/month for private

**For Company Projects:**
- Start with one project, not all at once
- Document the setup process as you go
- Create templates that can be reused
- Train teammates gradually
- Replace XAMPP piece by piece, not all at once

Good luck! You're building valuable DevOps skills that will make onboarding new developers SO much easier. 🚀