const React = require('react');
const SyntaxHighlighter = require('react-syntax-highlighter').default;
const { docco } = require('react-syntax-highlighter/dist/styles');

const Code = ({ children, ...props }) => (
  <SyntaxHighlighter {...props} showLineNumbers language="javascript" style={docco}>
    {children}
  </SyntaxHighlighter>
);

const DuplicateReport = ({ duplicates }) => (
  <div>
    <h2>Duplicate code</h2>
    {duplicates.map(({ instances }, i) => (
      <div key={i}>
        {instances.map(({ path, lines: [start, end], code }, i) => (
          <div key={i}>
            <h3>{path}</h3>
            <Code startingLineNumber={start}>{code}</Code>
          </div>
        ))}
        <hr />
      </div>
    ))}
  </div>
);

const LintReport = ({ lintErrors }) => (
  <div>
    <h2>High complexity code</h2>
    {lintErrors.map(({ filePath, messages, errorCount, source }, i) => (
      <div key={i}>
        <h3>{filePath}</h3>
        {messages.map(({ message, line, endLine }, i) => (
          <div key={i}>
            <h4 style={{ color: 'red' }}>{message}</h4>
            <Code startingLineNumber={line}>
              {source
                .split('\n')
                .slice(line - 1, endLine)
                .join('\n')}
            </Code>
          </div>
        ))}
      </div>
    ))}
  </div>
);

module.exports = ({ duplicates, lintErrors }) => {
  const hasLintErrors = lintErrors.length;
  const hasDuplicates = duplicates.length;
  return (
    <div>
      <h1>Code Review</h1>
      {hasLintErrors && <LintReport {...{ lintErrors }} />}
      {hasDuplicates && <DuplicateReport {...{ duplicates }} />}
      {!hasDuplicates && !hasLintErrors && <h2 style={{ color: 'green' }}>No issues found!</h2>}
    </div>
  );
};
