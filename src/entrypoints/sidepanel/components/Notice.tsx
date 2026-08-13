interface NoticeProps {
  title: string;
  detail: string;
}

/**
 * Every non-result screen. Four of the panel's five states end up here, which
 * is the point: a state the designer forgot still renders something a person
 * can read.
 */
export function Notice({ title, detail }: NoticeProps): React.JSX.Element {
  return (
    <main className="panel notice">
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
