# REACT_GL
Showcase built using React, Bootstrap and WebGL2. It also serves as a simple WebGL development framework with GLSL error messages (see details on running in test mode). It's built using webpack allowing for quick local deployments. To run this locally first make sure you have Node installed then:

navigate from the root project directory to src/main/js/static and unzip bugatti.obj.gz and ironman.obj.gz using your favourite zip tool. This is because the models are quite large and are zipped in the distribution.

...then open a terminal,  navigate to the project root directory and run:

npm install

npm run build

npm run start:showcase

finally open a web browser and navigate to:

http://localhost:8080

![alt text](https://github.com/shausoftware/REACT_GL/tree/master/src/main/js/static/images/react_gl.png)

To run this as a development tool a few changes need to be made:
change TEST_MODE from false to true in App.js. 
then point the variable testScript in file testpage.js to your new shader implemention.
Please take a look at how the samples provided are implemented. There is also a raw template (scripts/template.js) with method stubs. Finally run the following:

npm run start:dev

.. to have a fast WebGL build tool chain with GLSL compile errors. If your developing from an IDE such as Microsoft Code with Auto-Save options enabled then you have completely seemless deployment. The test page uses augmented-compile-shader by Jaume Sanchez Elias for the detailed GLSL compile errors. 
