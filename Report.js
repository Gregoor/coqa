const React = require('react');
const SyntaxHighlighter = require('react-syntax-highlighter').default;
const { docco } = require('react-syntax-highlighter/dist/styles');

const Code = ({ children, ...props }) => (
  <SyntaxHighlighter {...props} showLineNumbers language="javascript" style={docco}>
    {children}
  </SyntaxHighlighter>
);

const Summary = ({ style, ...props }) => (
  <summary {...props} style={{ cursor: 'pointer', ...style }} />
);

const LintReport = ({ lintErrors }) => (
  <div>
    <h2>Problematic code</h2>
    {lintErrors.map(({ filePath, messages, errorCount, source }, i) => (
      <div key={i}>
        <div>{filePath}</div>
        {messages.map(({ message, line, endLine }, i) => (
          <details key={i}>
            <Summary style={{ color: 'red' }}>{message}</Summary>
            <Code startingLineNumber={line}>
              {source
                .split('\n')
                .slice(line - 1, endLine)
                .join('\n')}
            </Code>
          </details>
        ))}
        <hr />
      </div>
    ))}
  </div>
);

const DuplicateReport = ({ duplicates }) => (
  <div>
    <h2>Duplicate code</h2>
    {duplicates.map(({ instances }, i) => (
      <div key={i} open>
        {instances.map(({ path, lines: [start, end], code }, i) => (
          <details key={i}>
            <Summary>{path}</Summary>
            <Code startingLineNumber={start}>{code}</Code>
          </details>
        ))}
        <hr />
      </div>
    ))}
  </div>
);

module.exports = ({ duplicates, lintErrors }) => (
  <div>
    <h1>Code Review</h1>
    {lintErrors.length && <LintReport {...{ lintErrors }} />}
    {duplicates.length && <DuplicateReport {...{ duplicates }} />}
  </div>
);
