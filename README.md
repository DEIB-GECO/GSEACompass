# GSEACompass 🧭

A Mmdern app to run GSEA, pre-ranked GSEA, ssGSEA and GSVA and do post-analysis elaboration on the results.

To know more about how to use GSEACompass, check out the offical user manual: [gseacompass.gitbook.io](https://gseacompass.gitbook.io/user-manual)

## Outline

- [Frameworks](#frameworks)
- [Run instructions](#run-instructions)
- [Build instructions](#build-instructions)
  - [Download](#download)
  - [Dependencies](#run-dependencies)
  - [Dependencies](#build-dependencies)
  - [Build and run](#build-and-run)

## Frameworks

This tool is mostly powered by:

- *GSEApy* on the python backend to run genomic analyses and graphical elaborations
- *Electron.js* on the desktop frontend
- *Datatables.js* as a view engine for post-analysis tables
- *Pyvis* as a view engine for similarity graphs

## Run instructions
To run GSEACompass, simply download the package required by your OS (Ubuntu-based, Mac, Windows) from the [*Releases*](https://github.com/DEIB-GECO/GSEACompass/releases) page on the Github repository and double click on it.

## Build instructions

### Binaries

Download GSEACompass source code

### Build from source

Make sure, before running GSEAWrap in a development enviroment, to fulfill these dependencies.

#### Python

Python3.12 and pip must be installed too, follow the official guides to install them ([Python](https://www.python.org/downloads/), [pip](https://pypi.org/project/pip/)).

#### System
The follow system dependencies are required, install only those regarding your operating system:

##### Ubuntu-based
Run the following command if your OS is Ubuntu or Ubuntu-based:
```bash
sudo apt install python3-devel
```
#### Fedora/RHEL
Run the following command if your OS is Fedora or similar:
```bash
sudo dnf install libquadmath libquadmath-devel
```

#### N.B. for Windows users: 
Make sure that Python is in the PATH environment variable.

#### Python libraries

Once Python and pip are installed, open the directory in which you have unzipped the GSEACompass archive and run the command:

```bash
pip install -r requirements.txt
```

This will install all the python-based dependencies needed to run the app.

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
npm start run
```
