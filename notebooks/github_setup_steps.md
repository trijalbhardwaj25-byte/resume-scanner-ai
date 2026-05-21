GITHUB PROJECT PUSH STEPS

1. Create a new repository on GitHub
- Keep repository Public or Private
- Do NOT check:
  - Add README
  - Add .gitignore
  - Add license

2. Open project in VS Code

3. Open terminal in VS Code
Terminal → New Terminal

4. Initialize Git

git init

Purpose:
Turns the project into a Git repository with version control.

5. Create .gitignore file in root folder

Content:

__pycache__/
*.pyc
.env

Purpose:
Prevents unnecessary files from uploading.

6. Create README.md file in root folder

Add project description, features, tech stack, etc.

7. Add all files to Git

git add .

Purpose:
Stages all project files for commit.

8. Create first commit

git commit -m "Initial project setup"

Purpose:
Creates first snapshot/version of project.

9. Copy GitHub repository link

Example:
https://github.com/USERNAME/REPOSITORY_NAME.git

10. Connect local project to GitHub

git remote add origin REPOSITORY_LINK

Example:
git remote add origin https://github.com/trijalbhardwaj25-byte/resume-scanner-ai.git

Purpose:
Connects local project with GitHub repository.

11. Set main branch

git branch -M main

12. Push project to GitHub

git push -u origin main

Purpose:
Uploads entire project to GitHub.

13. Refresh GitHub repository page

All project files should now appear online.