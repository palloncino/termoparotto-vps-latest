# MongoDB CLI & API One-Liner Cheat Sheet

## User Management (MongoDB CLI)

```bash
# Approve user
mongosh storage-app --eval "db.users.updateOne({email: 'user@example.com'}, {\$set: {status: 'approved'}})"
# Set user as pending
mongosh storage-app --eval "db.users.updateOne({email: 'user@example.com'}, {\$set: {status: 'pending'}})"
# Reject user
mongosh storage-app --eval "db.users.updateOne({email: 'user@example.com'}, {\$set: {status: 'rejected'}})"
# Change user role
mongosh storage-app --eval "db.users.updateOne({email: 'user@example.com'}, {\$set: {role: 'admin'}})"
# Find user
mongosh storage-app --eval "db.users.findOne({email: 'user@example.com'})"
# List all users
mongosh storage-app --eval "db.users.find({}, {email: 1, status: 1, name: 1, role: 1})"
# List pending users
mongosh storage-app --eval "db.users.find({status: 'pending'}, {email: 1, name: 1})"
# Delete user
mongosh storage-app --eval "db.users.deleteOne({email: 'user@example.com'})"
# Create user (manual hash needed)
mongosh storage-app --eval "db.users.insertOne({name: 'Name', email: 'user@example.com', passwordHash: 'HASH', role: 'user', status: 'approved', createdAt: new Date()})"
```

## Product Management (API)

```bash
# List products
curl -X GET http://localhost:16788/api/products
# Get product by ID
curl -X GET http://localhost:16788/api/products/PRODUCT_ID
# Create product
curl -X POST http://localhost:16788/api/products -H "Content-Type: application/json" -d '{"codice_articolo":"EL-001","codice_fornitore":"SUP-2024-001","descrizione_articolo":"Cavo elettrico multistrato 3x2.5mm - 100m","prezzo_listino":89.50,"prezzo_acquisto":45.00,"prezzo_concosti":52.00,"prezzo_cliente":75.00,"prezzo_iva10":82.50,"prezzo_iva22":91.29,"data_acquisto":"2024-01-15","settore":"Elettrico","marca":"CableTech","macrosettore":"Materiali Elettrici","famiglie":"Cavi e Conduttori","listino":1,"scontato":0,"con_spese_generali":5.00,"con_ricarico":15.00,"iva_al_10":7.50,"vendita_al_22":16.29,"uso":"Impianti civili e industriali","field_1":"Certificazione CE","field_2":"Temperatura max: 70°C","field_3":"Colore: Grigio"}'
# Update product
curl -X PUT http://localhost:16788/api/products/PRODUCT_ID -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"New Name"}'
# Delete product
curl -X DELETE http://localhost:16788/api/products/PRODUCT_ID -H "Authorization: Bearer TOKEN"
```

## Client Management (API)

```bash
# List clients
curl -X GET http://localhost:16788/api/clients
# Get client by ID
curl -X GET http://localhost:16788/api/clients/CLIENT_ID
# Create client
curl -X POST http://localhost:16788/api/clients -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"Client","email":"client@example.com"}'
# Update client
curl -X PUT http://localhost:16788/api/clients/CLIENT_ID -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"New Name"}'
# Delete client
curl -X DELETE http://localhost:16788/api/clients/CLIENT_ID -H "Authorization: Bearer TOKEN"
```

## Report Management (API)

```bash
# List reports
curl -X GET http://localhost:16788/api/reports
# Get report by ID
curl -X GET http://localhost:16788/api/reports/REPORT_ID
# Create report
curl -X POST http://localhost:16788/api/reports -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title":"Report","clientId":"CLIENT_ID"}'
# Update report
curl -X PUT http://localhost:16788/api/reports/REPORT_ID -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"title":"New Title"}'
# Delete report
curl -X DELETE http://localhost:16788/api/reports/REPORT_ID -H "Authorization: Bearer TOKEN"
```

## Worksite Management (API)

```bash
# List worksites
curl -X GET http://localhost:16788/api/worksites
# Get worksite by ID
curl -X GET http://localhost:16788/api/worksites/WORKSITE_ID
# Create worksite
curl -X POST http://localhost:16788/api/worksites -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"Worksite","clientId":"CLIENT_ID"}'
# Update worksite
curl -X PUT http://localhost:16788/api/worksites/WORKSITE_ID -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"New Name"}'
# Delete worksite
curl -X DELETE http://localhost:16788/api/worksites/WORKSITE_ID -H "Authorization: Bearer TOKEN"
```

## Authentication APIs

```bash
# Register user
curl -X POST http://localhost:16788/api/auth/register -H "Content-Type: application/json" -d '{"name":"User","email":"user@example.com","password":"123456","role":"user"}'
# Login
curl -X POST http://localhost:16788/api/auth/login -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"123456"}'
# Check status
curl -X GET http://localhost:16788/api/auth/status/user@example.com
```

## Server & DB Management

```bash
# Check server status
curl -I http://localhost:16788
# PM2 status
pm2 status
# Server logs
pm2 logs storage-app-server --lines 10
# DB stats
mongosh storage-app --eval "db.stats()"
# Backup DB
mongodump --db storage-app --out /backup/path
# Restore DB
mongorestore --db storage-app /backup/path/storage-app
# Insert a product
mongosh storage-app --eval 'db.products.insertOne({
  "codice_articolo": "EL-001",
  "codice_fornitore": "SUP-2024-001",
  "descrizione_articolo": "Cavo elettrico multistrato 3x2.5mm - 100m",
  "prezzo_listino": 89.50,
  "prezzo_acquisto": 45.00,
  "prezzo_concosti": 52.00,
  "prezzo_cliente": 75.00,
  "prezzo_iva10": 82.50,
  "prezzo_iva22": 91.29,
  "data_acquisto": "2024-01-15",
  "settore": "Elettrico",
  "marca": "CableTech",
  "macrosettore": "Materiali Elettrici",
  "famiglie": "Cavi e Conduttori",
  "listino": 1,
  "scontato": 0,
  "con_spese_generali": 5.00,
  "con_ricarico": 15.00,
  "iva_al_10": 7.50,
  "vendita_al_22": 16.29,
  "uso": "Impianti civili e industriali",
  "field_1": "Certificazione CE",
  "field_2": "Temperatura max: 70°C",
  "field_3": "Colore: Grigio"
})'
```


---
- Replace TOKEN with your JWT token
- Replace IDs and emails as needed
- Use `localhost:16788` or your production domain