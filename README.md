# Report-viewer 1.5
This is a web app that displays the test data stored in `cradle` using `report-data-provider`. 
Minor versions of report-viewer and report-data-provider are compatible.

# API
This app needs `report-data-provider 1.5` backend component to function. 
Make sure it is available at `http://<host>:<port>/<report-viewer-root>/backend/*`

# Configuration
No configuration required. 
The resulting docker image contains static resources (js, html, etc) and a web server (nginx).

# Screenshots
![picture](screenshot.png)
