# WebOWL + OWL2VOWL distribution for schema.gov.it

This is a release of WebOWL + OWL2VOWL for https://schema.gov.it
where dependencies are updated and the CI includes further checks.

WebVOWL
=======

This repository was ported from an internal SVN repository to Github after the release of WebVOWL 0.4.0. Due to cleanups with `git filter-branch`, the commit history might show some strange effects.


Requirements
------------

Node.js for installing the development tools and dependencies.


Development setup
-----------------

### Simple ###
1. Download and install Node.js from http://nodejs.org/download/
2. Open the terminal in the root directory
3. Run `npm install` to install the dependencies and build the project
4. Edit the code
5. Run `npm run build` to (re-)build all necessary files into the deploy directory
6. Run `serve deploy/` to run the server locally, by installing serve by using `npm install serve -g`.

Visit [http://localhost:3000](http://localhost:3000) to use WebVOWL.
 
* `npm run build` builds the development version into the deploy directory
* `npm run watch` Run webpack and watch for files changes.To check the progress of any webpack.
* `npm run start` starts a local live-updating webserver with the current development version
* `npm run test` starts the test runner
* `npm run owasp` test all vulnerability with owasp


Additional information
----------------------

To export the VOWL visualization to an SVG image, all css styles have to be included into the SVG code.
This means that if you change the CSS code in the `vowl.css` file, you also have to update the code that
inlines the styles - otherwise the exported SVG will not look the same as the displayed graph.

The tool which creates the code that inlines the styles can be found in the util directory. Please
follow the instructions in its [README](util/VowlCssToD3RuleConverter/README.md) file.



OWL2VOWL converter 
==================

Owl2Vowl is an ontology converter used to convert the given ontology to a json format that is used in the WebVOWL visualization. 


Requirements
------------
*   Java 11 (or higher)
*   Gradle

### Build the war
To build the war file, simply execute `./gradlew clean build`. This will generate a war file.


Run Using Docker
------------
Make sure you are inside root directory and you have docker installed. Run the following command to build the docker image:

`docker compose build`

Run the following command to run WebVOWL at port 8080. 

`docker-compose up -d` 

Visit [http://localhost:8080](http://localhost:8080) to use WebVOWL.
