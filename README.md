# GSEAWrap

A minimalistic yet powerful app to run *GSEA*, pre-ranked *GSEA* and, **mostly**, do post-analysis elaboration on the results!

To know more about how to use GSEAWrap and its idiosyncratic features, check out the offical user manual: [gseawrap.gitbook.io/user-manual](https://gseawrap.gitbook.io/user-manual)

## Outline

- [Frameworks](#frameworks)
- [Run instructions](#run-instructions)
  - [For users](#for-users)
  - [For developers](#for-developers)
- [Build instructions](#build-instructions)
  - [Dependencies](#build-dependencies)
  - [Build and run](#build-and-run)

## Frameworks

This tool is super-powered by:

- *GSEApy* on the python backend to run genomic analyses and graphical elaborations
- *Electron.js* on the desktop frontend
- *Datatables.js* as a view engine for post-analysis tables

## Run instructions

### For users

Simpyl download the latest stable version of GSEAWrap from the [releases page](https://github.com/DEIB-GECO/GSEAWrap/releases) and 
install it according to your OS. No dependency must be fulfilled or library installed.

### For developers

Make sure, before running GSEAWrap in a development enviroment, to fulfill these run-time dependencies.

#### Rust

The Rust development environment has to be installed on your machine, since it's compulsory to install and run GSEApy.
Follow this [link](https://www.rust-lang.org/tools/install) for the official instructions to download and install it.

#### Python

Python3.12 and pip must be installed too, follow the official guides to install them ([python one](https://www.python.org/downloads/), [pip one](https://pypi.org/project/pip/)).

#### Python libraries

Once Python and pip are installed, open the directory in which you have unzipped the GSEAWrap archive and run the command:

```bash
pip install -r requirements.txt
```

This will install all python-based dependencies needed to run the app.

## Build instructions

### Build dependencies

#### Node.js

Mind that Node.js is required to be installed on you system in order to build and run this application.
Moreover, as suggested on the official Electron.js website:
> Please install Node.js using pre-built installers for your platform. You may encounter incompatibility issues with different development tools otherwise.
>
Follow the [official guide](https://nodejs.org/en/download) to install it.

#### Npm dependencies

Once installed Node.js, all npm-based dependencies can be installed with the following command, make sure to be in your local repository directory:

```bash
npm install
```

### Build and run

To build and run the application just run the following command, make sure to be in the repository directory:

```bash
npm run start
```

In order to run the app, be sure to have installed the run dependencies too (see [up above](#run-dependencies)).
