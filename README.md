# SHAU_GL
Showcase built using React, Bootstrap and WebGL. It also serves as a simple WebGL development framework with GLSL error messages (see details on running in test mode). It's built using webpack allowing for quick local deployments. To run this locally first make sure you have Node installed then:

navigate from the root directory to /src/main/js/static and extract bugatti.obj from bugatti.obj.gz and ironman.obj.gz.

gunzip bugatti.obj.gz

gunzip ironman.obj.gz

...then open a terminal,  navigate to the project root directory and run:

npm install
npm start:showcase

finally open a web browser and navigate to:

http://localhost:8080

To run in test mode change to TEST_MODE=true; in App.js. Point the variable testScript to the content script to be tested and run webpack --watch to have a fast WebGL build tool chain. The test page uses augmented-compile-shader by Jaume Sanchez Elias for detailed GLSL compile errors. 
