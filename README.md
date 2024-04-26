# GSEAWrap
A minimalistic yet powerful app to run *GSEA*, pre-ranked *GSEA* and *ssGSEA* and, **mostly**, do post-analysis elaboration on the results!

# Frameworks
This tool is powered by:
- *GSEApy* on the python backend to run genomic analysises and graphical elaborations
- *Electron.js* on the desktop frontend
- *Datatables.js* as a view engine for post-analysis tables

# Run dependencies
## Python3 and pip
Python3 and pip need to be installed on your machine to use GSEAWrap, follow the official guides to install them.
## Rust
The Rust development environment has to be installed on your machine, since it's compulsory to install and run gseapy
## Pip dependecies
These pip-based dependencies need to be fullfilled too: dill, pandas, matplotlib, gseapy.
Install them with the following command:
`pip install --user XXXX` where XXXX is dill/pandas/ecc..

# Build instructions
## Dependecies
### Node.js
Mind that Node.js is required to be installed on you system in order to build and run this application.
Moreover, as suggested on the official Electron.js website:
> Please install Node.js using pre-built installers for your platform. You may encounter incompatibility issues with different development tools otherwise.
### Npm dependencies
Once installed Node.js, all npm-based dependencies can be installed with the following command, make sure to be in the repository directory:
`npm install`
### Run dependencies
In order to run the app be sure to have installed the run dependencies too (up above).
## Building and running
To build and run the application just run the following command, make sure to be in the repository directory:
`npm start`
