# Coqa (Code Quality Assurance)

Generates reports about duplicate/problematic JavaScript code.

Defers all the hard work to [ESLint](https://eslint.org/) and [jsinspect](https://github.com/danielstjules/jsinspect).

## Installation
```bash
yarn global add coqa
```
Or if you prefer NPM:
```bash
npm install --global coqa
```

## Usage
```bash
  Usage: coqa [options] <paths ...>


  Options:

    -V, --version           output the version number
    -w, --wait <pattern>    seconds to wait for browser to open
    -i, --ignore <pattern>  ignore paths matching a regex
    -d, --debug             print debug information
    -h, --help              output usage information
```

Code Duplication usually contains some false positives. I currently use my browsers
DevTools to remove those, before submitting the review.

A better version of this tool would let you select which to keep (and maybe also
show a colored diff).