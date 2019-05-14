# Database Indexes

## v1 Deploy

```javascript
// Create seed admin account.

// Password is "Password1".
db.users.insertOne({ _id: ObjectId(), active: true, email: "admin@realfolk.io", passwordHash: "$2b$10$rCo6nnHg/Z2HUcxaGI0tnesXsdW6NhGv.vS1wmlehorzRJBmu2qqS", profile: { type: "PROGRAM_STAFF", firstName: "First", lastName: "Admin", positionTitle: "First Admin" }, createdAt: ISODate(), updatedAt: ISODate() })

//Indexes

// expire after 2 days
db.forgotpasswordtokens.createIndex({"createdAt": 1}, {expireAfterSeconds: 172800})
db.forgotpasswordtokens.createIndex({"token": 1})

// expire after 7 days
db.sessions.createIndex({"updatedAt": 1}, {expireAfterSeconds: 604800})
db.sessions.createIndex({"sessionId": 1})
db.sessions.createIndex({"user.id": 1})

db.users.createIndex({"email": 1})
db.users.createIndex({"profile.type": 1})
```

## v2 Deploy

```javascript
db.rfipreviews.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });
```
