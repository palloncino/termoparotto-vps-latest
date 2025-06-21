# first deploy

Copy your server directory (excluding node_modules) to the server
```bash
scp -r -P 16789 ./server/ microweb@termoparotto.micro-cloud.it:/var/www/storage-app-server/
```

Copy the .env.remote file and rename it to .env on the server
```bash
scp -P 16789 ./server/.env.remote microweb@termoparotto.micro-cloud.it:/var/www/storage-app-server/.env
```
