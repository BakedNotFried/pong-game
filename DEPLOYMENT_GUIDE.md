# Pong Game Deployment Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `pong-game` (or your preferred name)
3. Description: "Simple Pong game built with HTML5 Canvas"
4. Set to **Public** (required for GitHub Pages free tier)
5. Don't initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pong-game.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" (in the repository, not your profile)
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select:
   - Deploy from a branch
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"

Your game will be available at: `https://YOUR_USERNAME.github.io/pong-game/`

## Step 4: Custom Domain Setup

### In GitHub:
1. In the Pages settings, under "Custom domain", enter your domain (e.g., `pong.yourdomain.com`)
2. Click "Save"
3. Check "Enforce HTTPS" (may take a few minutes to be available)

### In Cloudflare:
1. Log into your Cloudflare dashboard
2. Select your domain
3. Go to DNS settings
4. Add a CNAME record:
   - Type: `CNAME`
   - Name: `pong` (or `@` for root domain)
   - Target: `YOUR_USERNAME.github.io`
   - Proxy status: DNS only (gray cloud)
   - TTL: Auto

## Step 5: Wait for Propagation

- GitHub Pages deployment: 5-10 minutes
- DNS propagation: 5 minutes to 48 hours (usually within 1 hour)

## Troubleshooting

- If the site doesn't load, check the Pages section in GitHub Settings for any error messages
- Ensure your repository is public
- Clear your browser cache if you see an old version
- Check Cloudflare DNS settings if using a custom domain

## Your Game URLs

Once deployed, your game will be accessible at:
- GitHub Pages URL: `https://YOUR_USERNAME.github.io/pong-game/`
- Custom domain: `https://pong.yourdomain.com` (or your chosen subdomain)