import type { CheckResult, CheckStatus, RepoAnalysis } from '../../../core/types.js';
import { sortForDisplay } from '../format.js';

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Problem',
  unknown: 'Not checked',
};

export function CheckList({ analysis }: { analysis: RepoAnalysis }): React.JSX.Element {
  return (
    <ul className="checks">
      {sortForDisplay(analysis.checks).map((check) => (
        <li key={check.id}>
          <CheckRow check={check} />
        </li>
      ))}
    </ul>
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

      {check.fix !== undefined && <p className="fix">{check.fix}</p>}
    </details>
  );
}
