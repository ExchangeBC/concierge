## Instructions for Backup Container building and deployment - Procurement Concierge MongoDB and MongoDB HA stateful set

-----

To build the backup-container image, run the following commands in the tools namespace:

```
oc process -f templates/backup/backup-build.yaml | oc create -f -
oc tag backup-mongo:latest backup-mongo:dev
oc tag backup-mongo:latest backup-mongo:test
oc tag backup-mongo:latest backup-mongo:prod
```

-----

To deploy the backup-container image to each applications namespace (dev/test/prod), run the following for each environment:

PROD:

```
oc process -f templates/backup/backup-config.yaml \
-p DATABASE_SERVICE_NAME=mongodb-concierge-prod \
-p DATABASE_PORT=27017 \
-p DATABASE_NAME=concierge | oc create -f -
```

```
oc process -f templates/backup/backup-deploy.yaml \
-p DATABASE_DEPLOYMENT_NAME=mongodb-concierge-prod \
-p TAG_NAME=prod \
-p BACKUP_VOLUME_SIZE=10Gi | oc create -f -
```

TEST:

```
oc process -f templates/backup/backup-config.yaml \
-p DATABASE_SERVICE_NAME=mongodb-concierge-test \
-p DATABASE_PORT=27017 \
-p DATABASE_NAME=concierge | oc create -f -
```

```
oc process -f templates/backup/backup-deploy.yaml \
-p DATABASE_DEPLOYMENT_NAME=mongodb-concierge-test \
-p TAG_NAME=test \
-p BACKUP_VOLUME_SIZE=1Gi | oc create -f -
```

DEV:

```
oc process -f templates/backup/backup-config.yaml \
-p DATABASE_SERVICE_NAME=mongodb-concierge-dev \
-p DATABASE_PORT=27017 \
-p DATABASE_NAME=concierge | oc create -f -
```

```
oc process -f templates/backup/backup-deploy.yaml \
-p DATABASE_DEPLOYMENT_NAME=mongodb-concierge-dev \
-p TAG_NAME=dev \
-p BACKUP_VOLUME_SIZE=1Gi | oc create -f -
```