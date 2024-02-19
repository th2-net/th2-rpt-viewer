# Report-viewer

![](https://img.shields.io/github/package-json/v/th2-net/th2-rpt-viewer/version-5.1)
![](https://img.shields.io/github/actions/workflow/status/th2-net/th2-rpt-viewer/build-release.yml?branch=version-5.1)
This is a web app that displays the stored test data (events and messages) using `report-data-provider`.

# API

This app needs `report-data-provider 5.1.0 (or newer)` backend component to function. It should be accessible at `{rpt-viewer-path}/backend/*`

# Configuration

To include this component in your schema, a following yml file needs to be created

```
apiVersion: th2.exactpro.com/v2
kind: Th2CoreBox
metadata:
  name: rpt-data-viewer
spec:
  imageName: ghcr.io/th2-net/th2-rpt-viewer
  imageVersion: 5.1.19 // change this line if you want to use a newer version
  type: th2-rpt-viewer
  extendedSettings:
    resources:
      limits:
        cpu: 50m
        memory: 50Mi
      requests:
        cpu: 50m
        memory: 50Mi
    service:
      enabled: true
      clusterIP:
      - name: gui
        containerPort: 8080
        port: 8080

```

# Screenshots

![picture](screenshot.png)
