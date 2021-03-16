## Notes for Procurement Concierge deployment to OCP4

All below commands should be run from openshift directory in the project root. You will also need to log in with the oc command line tool and a token retrieved from the OpenShift 4 Web GUI.

For instructions on deploying the Backup Container for each environment please refer to [BACKUPS.md](./BACKUPS.md).

-----

To create default network security policies, run this command in each namespace, replacing `<namespace>` with the name of the target namespace:

```
oc process -f \
https://github.com/bcgov/networkpolicy-migration-workshop/blob/main/quickstart.yaml \
-p NAMESPACE=<namespace> | oc apply -f -
```

-----

To create permissions for image pulls between namespaces, run this in the tools namespace, replacing `<yyyy>` with the name of the namespace that is pulling images (e.g. 1b91ec-dev):

```
oc policy add-role-to-user system:image-puller system:serviceaccount:<yyyy>:default --namespace=1b91ec-tools
```

-----

To create build configs for the application images, run these commands in the tools namespace:

```
oc process -f templates/app/app-concierge-build.yaml -p ENV_NAME=dev -p GIT_REF=development | oc create -f -
oc process -f templates/app/app-concierge-build.yaml -p ENV_NAME=test -p GIT_REF=master | oc create -f -
oc process -f templates/app/app-concierge-build.yaml -p ENV_NAME=prod -p GIT_REF=master | oc create -f -
```

------

To deploy a single MongoDB instance (for use in DEV and TEST):

```
oc process -f templates/database/mongodb-concierge-deploy.yaml -p TAG_NAME=dev | oc create -f -
```

```
oc process -f templates/database/mongodb-concierge-deploy.yaml -p TAG_NAME=test | oc create -f -
```

------

To deploy a highly available MongoDB stateful set (for use in PROD):

```
oc process -f templates/database/mongodb-concierge-replicaset-deploy.yaml -p TAG_NAME=prod | oc create -f -
```

------

To deploy the Concierge app, run these commands in each namespace (dev/test/prod).

```
oc process -f templates/app/app-concierge-deploy.yaml \
	-p TAG_NAME=dev | oc create -f -
```

```
oc process -f templates/app/app-concierge-deploy.yaml \
	-p TAG_NAME=test | oc create -f -
```

```
oc process -f templates/app/app-concierge-deploy.yaml \
	-p TAG_NAME=prod \
	-p MONGODB_REPLICA_NAME=rs0 | oc create -f -
```

