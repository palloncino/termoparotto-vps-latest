# Git SSH Setup - Quick Reference

## 🔑 SSH Key Setup for GitHub

When you get "Permission denied (publickey)" error when pushing to GitHub, use these commands:

### 1. Start SSH Agent
```bash
eval "$(ssh-agent -s)"
```

### 2. Add Your SSH Key
```bash
ssh-add ~/.ssh/github_ed25519
```

### 3. Test GitHub Connection
```bash
ssh -T git@github.com
```
You should see: `Hi palloncino! You've successfully authenticated, but GitHub does not provide shell access.`

### 4. Now You Can Push
```bash
git push
```

## 📝 Complete Workflow Example

```bash
# Check current branch
git branch

# Start SSH agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github_ed25519

# Test connection
ssh -T git@github.com

# Push your changes
git push
```

## 🔧 If SSH Key Doesn't Exist

If you don't have an SSH key yet:

### Generate New SSH Key
```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/github_ed25519
```

### Add to GitHub
1. Copy the public key: `cat ~/.ssh/github_ed25519.pub`
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste the key and save

## 🚨 Common Issues

- **"Permission denied"**: SSH key not added to agent or GitHub
- **"Agent pid"**: SSH agent is running (this is good)
- **"Hi username!"**: Connection successful

## 💡 Pro Tip

You can add this to your `~/.bashrc` to automatically start SSH agent:
```bash
# Add to ~/.bashrc
if [ -z "$SSH_AUTH_SOCK" ]; then
   eval "$(ssh-agent -s)" > /dev/null
   ssh-add ~/.ssh/github_ed25519 2>/dev/null
fi
```

---

**Remember:** Run `eval "$(ssh-agent -s)"` and `ssh-add ~/.ssh/github_ed25519` whenever you need to push to GitHub! 