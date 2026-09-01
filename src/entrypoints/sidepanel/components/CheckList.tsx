import type { CheckResult, CheckStatus, RepoAnalysis } from '../../../core/types.js';
import { groupForDisplay } from '../format.js';

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Problem',
  unknown: 'Not checked',
};

export function CheckList({ analysis }: { analysis: RepoAnalysis }): React.JSX.Element {
  const { findings, passed } = groupForDisplay(analysis.checks);

  return (
    <>
      <ul className="checks">
        {findings.map((check) => (
          <li key={check.id}>
            <CheckRow check={check} />
          </li>
        ))}
      </ul>

      {passed.length > 0 && (
        // Open when nothing went wrong, because then there is nothing for it to
        // be hiding and a panel showing one collapsed line looks like a failure
        // to load.
        <details className="passed" open={findings.length === 0}>
          <summary>
            <span className="dot" aria-hidden="true" />
            <span className="title">Passed</span>
            <span className="status-label">{passed.length}</span>
          </summary>

          <ul className="checks">
            {passed.map((check) => (
              <li key={check.id}>
                <CheckRow check={check} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function CheckRow({ check }: { check: CheckResult }): React.JSX.Element {
  return (
    // Findings start open, passes start closed: the reader came here for what
    // is wrong. `details` also gives keyboard support and screen reader state
    // for free, which a div with an onClick would not.
    <details className={`check status-${check.status}`} open={check.status !== 'pass'}>
      <summary>
        <span className="dot" aria-hidden="true" />
        <span className="title">{check.title}</span>
        <span className="status-label">{STATUS_LABEL[check.status]}</span>
      </summary>

      <ul className="evidence">
        {check.evidence.map((item) => (
          <li key={item.text}>
            {item.url === undefined ? (
              item.text
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.text}
              </a>
            )}
          </li>
        ))}
      </ul>

      {check.advice !== undefined && <p className="advice">{check.advice}</p>}
    </details>
  );
}
