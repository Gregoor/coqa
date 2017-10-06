const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { CLIEngine } = require('eslint');
const filepaths = require('filepaths');
const program = require('commander');
const { Inspector, reporters } = require('jsinspect');
const opn = require('opn');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const tmp = require('tmp');

program
  .version(require('./package.json').version)
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
    const inspector = new Inspector(allFilePaths, require('./.jsinspectrc.json'));

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
  const cli = new CLIEngine(
    Object.assign(
      {
        useEslintrc: false
      },
      require('./.eslintrc.json')
    )
  );
  const report = cli.executeOnFiles(allFilePaths);
  const ruleResults = report.results
    .filter(r => r.messages.length)
    .map(result =>
      Object.assign({}, result, {
        filePath:
          paths.length === 1
            ? '.' + result.filePath.substr(path.resolve(paths[0]).length)
            : result.filePath
      })
    )
    .reduce((rulesResults, result) => {
      for (const message of result.messages) {
        const { ruleId } = message;
        const ruleResults = rulesResults[ruleId] || (rulesResults[ruleId] = []);
        let fileResults = ruleResults.find(r => (r.filePath = result.filePath));
        if (!fileResults) {
          fileResults = Object.assign({}, result, { messages: [] });
          ruleResults.push(fileResults);
        }
        fileResults.messages.push(message);
      }
      return rulesResults;
    }, {});
  return Object.entries(ruleResults)
    .map(([rule, paths]) => [
      rule,
      paths,
      paths.reduce((sum, { messages }) => sum + messages.length, 0)
    ])
    .sort((r1, r2) => r1[2] < r2[2]);
}

async function start() {
  const [duplicates, lintErrors] = await Promise.all([runInspect(), runLint()]);
  if (!duplicates.length && !lintErrors.length) {
    return console.log('no problems found!');
  }
  require('babel-register');
  const tmpFile = tmp.fileSync({ postfix: '.html' });
  fs.writeFileSync(
    tmpFile.name,
    ReactDOMServer.renderToStaticMarkup(
      React.createElement(require('./Report'), {
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
