# SHAU_GL
Work in progress, third iteration of my SHAUSTUFF website using React and Bootstrap. It also serves as a WebGL development framework for me (see details on running in test mode). It's built using webpack allowing for quick local deployments. To run this locally install node and then:

navigate from the root directory to /src/main/js/static and extract bugatti.obj from bugatti.obj.gz and ironman.obj.gz.

gunzip bugatti.obj.gz
gunzip ironman.obj.gz

...then from the project root directory:

npm install

webpack-dev-server

then open a web browser and navigate to:

http://localhost:8080

To run in test mode change to TEST_MODE=true; in App.js. Point the variable testScript to the content script to be tested and run webpack --watch to have a fast WebGL build tool chain. The test page now uses augmented-compile-shader by Jaume Sanchez Elias for detailed GLSL compile errors. 
