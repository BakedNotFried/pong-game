# Cloudflare Setup for pong.squawknet.net

## Step-by-Step Instructions

1. **Log into Cloudflare** at https://dash.cloudflare.com

2. **Select your domain:** squawknet.net

3. **Go to DNS settings** (left sidebar)

4. **Add a CNAME record:**
   - **Type:** CNAME
   - **Name:** pong
   - **Target:** bakednotfried.github.io
   - **Proxy status:** DNS only (click the orange cloud to make it gray)
   - **TTL:** Auto
   
5. **Click "Save"**

## What This Does

- Creates a subdomain `pong.squawknet.net`
- Points it to your GitHub Pages site
- DNS-only mode ensures GitHub can handle SSL certificates

## Alternative: Use Root Domain

If you want to use `squawknet.net` (without subdomain):
1. Update CNAME file to just `squawknet.net`
2. In Cloudflare, use these records:
   - **Type:** A
   - **Name:** @
   - **Content:** 185.199.108.153 (GitHub Pages IP)
   - Add additional A records for: 185.199.109.153, 185.199.110.153, 185.199.111.153

## Verification URLs

After DNS propagation (5-30 minutes):
- **Your game:** https://pong.squawknet.net
- **GitHub Pages:** https://bakednotfried.github.io/pong-game/

## Troubleshooting

- If you see "404" or GitHub pages error, wait a few more minutes
- If you see Cloudflare error, ensure proxy is OFF (gray cloud)
- Clear browser cache if you see old content