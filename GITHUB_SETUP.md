# Setting Up GitHub Repository

Follow these steps to create a new GitHub repository for your MyChat application:

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com/) and sign in to your account.
2. Click on the "+" icon in the top-right corner and select "New repository".
3. Name your repository "mychat".
4. Add a description: "A real-time chat application with WebSockets".
5. Choose to make the repository public or private.
6. Do not initialize the repository with a README, .gitignore, or license (we'll add these later).
7. Click "Create repository".

## 2. Initialize Your Local Repository

1. Open a terminal in your project directory.
2. Initialize a new Git repository:
   ```
   git init
   ```
3. Add all files to the staging area:
   ```
   git add .
   ```
4. Commit the changes:
   ```
   git commit -m "Initial commit"
   ```

## 3. Connect Local Repository to GitHub

1. Add the remote repository:
   ```
   git remote add origin https://github.com/yourusername/mychat.git
   ```
   Replace `yourusername` with your GitHub username.

2. Push your code to GitHub:
   ```
   git push -u origin main
   ```
   If your default branch is named "master" instead of "main", use:
   ```
   git push -u origin master
   ```

## 4. Set Up Branch Protection (Optional)

For better collaboration:

1. Go to your repository on GitHub.
2. Click on "Settings" > "Branches".
3. Under "Branch protection rules", click "Add rule".
4. Enter "main" (or "master") as the branch name pattern.
5. Check options like "Require pull request reviews before merging" and "Require status checks to pass before merging".
6. Click "Create" to save the rule.

## 5. Set Up GitHub Actions (Optional)

To automate testing and deployment:

1. Create a `.github/workflows` directory in your project.
2. Create a workflow file (e.g., `ci.yml`) for continuous integration.
3. Set up the workflow to run tests and linting on each push or pull request.

## 6. Set Up GitHub Secrets for Deployment

If you're using GitHub Actions for deployment, add these secrets:

1. Go to your repository on GitHub.
2. Click on "Settings" > "Secrets" > "Actions".
3. Add the following secrets:
   - `DATABASE_URL`: Your database connection string
   - `JWT_SECRET`: Your JWT secret key

These secrets will be used in your GitHub Actions workflows for deployment. 