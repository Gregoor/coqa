import fs from 'fs';
import path from 'path';
import stream from 'stream';
import { CLIEngine } from 'eslint';
import filepaths from 'filepaths';
import program from 'commander';
import { Inspector, reporters } from 'jsinspect';
import opn from 'opn';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import tmp from 'tmp';
import { version } from '../package.json';
import Report from './Report';

program
  .version(version.version)
  .usage('[options] <paths ...>')
  .option('-w, --wait <pattern>', 'seconds to wait for browser to open', 3)
  .option('-i, --ignore <pattern>', 'ignore paths matching a regex')
  .option('-d, --debug', 'print debug information')
  .parse(process.argv);

const ignore = ['node_modules', 'bower_components', 'test', 'spec'];
if (program.ignore) {
  ignore.push(program.ignore);
}

const paths = program.args.length ? program.args : ['.'];
const allFilePaths = filepaths.getSync(paths, {
  ext: ['.js', '.jsx'],
  ignore
});

if (program.debug) {
  console.log('Checking:', '\n', allFilePaths.join('\n'));
}

function runInspect() {
  return new Promise(resolve => {
    const inspector = new Inspector(allFilePaths, require('../.jsinspectrc.json'));

    const matches = [];
    const writableStream = new stream.Writable({
      write(chunk, encoding, next) {
        matches.push(chunk.toString());
        next();
      }
    });
    writableStream.on('finish', () => {
      resolve(JSON.parse(matches.join('')));
    });
    new reporters.json(inspector, { writableStream });
    inspector.run();
  });
}

function runLint() {
  const cli = new CLIEngine({
    useEslintrc: false,
    ...require('../.eslintrc.json')
  });
  const report = cli.executeOnFiles(allFilePaths);
  return report.results
    .filter(r => r.messages.length)
    .map(result => ({
      ...result,
      filePath:
        paths.length === 1
          ? '.' + result.filePath.substr(path.resolve(paths[0]).length)
          : result.filePath
    }))
    .reduce((rulesPaths, result) => {
      for (const message of result.messages) {
        const { ruleId } = message;
        let rulePaths = rulesPaths.find(([rule]) => rule === ruleId);
        if (!rulePaths) {
          rulePaths = [ruleId, [], 0];
          rulesPaths.push(rulePaths);
        }
        rulePaths[2] += 1;

        let pathMessages = rulePaths[1].find(({ filePath }) => filePath === result.filePath);
        if (!pathMessages) {
          pathMessages = { ...result, messages: [] };
          rulePaths[1].push(pathMessages);
        }
        pathMessages.messages.push(message);
      }
      return rulesPaths;
    }, [])
    .sort((r1, r2) => r1[2] < r2[2]);
}

async function start() {
  const [duplicates, lintErrors] = await Promise.all([runInspect(), runLint()]);
  if (!duplicates.length && !lintErrors.length) {
    return console.log('no problems found!');
  }
  const tmpFile = tmp.fileSync({ postfix: '.html' });
  fs.writeFileSync(
    tmpFile.name,
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(Report, {
        duplicates,
        lintErrors
      })
    )
  );
  await opn('file://' + tmpFile.name);
  await new Promise(resolve => setTimeout(resolve, program.wait * 1000));
}

start().catch(error => {
  console.error(error);
});
