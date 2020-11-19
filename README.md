# Report-viewer
![](https://img.shields.io/github/package-json/v/th2-net/th2-rpt-viewer)
![](https://img.shields.io/github/workflow/status/th2-net/th2-rpt-viewer/Build%20and%20publish%20Docker%20distributions%20to%20Github%20Container%20Registry%20ghcr.io)

This is a web app that displays the test data stored in `cradle` using `report-data-provider`. 
Minor versions of report-viewer and report-data-provider are compatible.

# API
This app needs `report-data-provider 2.0` backend component to function. 
Make sure it is available at `http://<host>:<port>/<report-viewer-root>/backend/*`

# Configuration
No configuration required. 
The resulting docker image contains static resources (js, html, etc) and a web server (nginx).

# Screenshots
![picture](screenshot.png)
