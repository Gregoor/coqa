# Skeptic

Automatically generates reports about problematic JavaScript code.

Defers all the hard work to [ESLint](https://eslint.org/) and [jsinspect](https://github.com/danielstjules/jsinspect).

## Installation (not yet on NPM)
```bash
yarn global add code-skeptic
```
Or if you prefer NPM:
```bash
npm install --global code-skeptic
```

## Usage
```bash
  Usage: index [options] <paths ...>


  Options:

    -V, --version           output the version number
    -w, --wait <pattern>    seconds to wait for browser to open
    -i, --ignore <pattern>  ignore paths matching a regex
    -d, --debug             print debug information
    -h, --help              output usage information
```