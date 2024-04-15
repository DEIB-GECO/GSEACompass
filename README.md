# GSEAWrap
A minimalistic yet powerful app to run *GSEA*, pre-ranked *GSEA* and *ssGSEA* and, **mostly**, do post-analysis elaboration on the results!

# Frameworks
This tool is powered by:
- *GSEApy* on the python backend to run genomic analysises and graphical elaborations
- *Electron.js* on the desktop frontend
- *Datatables.js* as a view engine for post-analysis tables

# Build instructions
## Dependecies
### Node.js
Mind that Node.js is required to be installed on you system in order to build and run this application.
Moreover, as suggested on the official Electron.js website:
> Please install Node.js using pre-built installers for your platform. You may encounter incompatibility issues with different development tools otherwise.
### Electron.js
Electron, once installed Node.js, can be installed with the following command, make sure to be in the repository directory:
`npm install --save-dev electron`
## Building and running
To build and run the application just run the following command:
`npm start`
