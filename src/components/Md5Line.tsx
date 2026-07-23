export function Md5Line(props: {
  expectedLabel: string
  actualLabel: string
  expected?: string
  actual?: string
  passed: boolean | null
}) {
  const { expectedLabel, actualLabel, expected, actual, passed } = props
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      fontSize: '13px', color: 'var(--ink2)', marginTop: '8px',
      flexWrap: 'wrap'
    }}>
      <span>
        <span style={{ fontWeight: 500 }}>{expectedLabel}:</span>{' '}
        <code style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '12px',
          background: 'var(--surface2)',
          padding: '2px 6px',
          borderRadius: '4px',
          color: 'var(--ink3)'
        }}>
          {expected ?? '-'}
        </code>
      </span>
      <span>
        <span style={{ fontWeight: 500 }}>{actualLabel}:</span>{' '}
        <code style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '12px',
          background: 'var(--surface2)',
          padding: '2px 6px',
          borderRadius: '4px',
          color: 'var(--ink3)'
        }}>
          {actual ?? '-'}
        </code>
      </span>
      {passed !== null && (
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: '12px', fontWeight: 600,
          color: passed ? 'var(--green)' : 'var(--red)',
        }}>
          {passed ? '\u2713' : '\u2717'}
        </span>
      )}
    </div>
  )
}
