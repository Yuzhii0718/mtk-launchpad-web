import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { LogEntry } from '../../types'
import type { TerminalNewlineMode, TerminalSpecialKey } from '../../utils/terminalControl'
import type { PostFlashAction } from '../../types'

type ConsoleTab = 'logs' | 'terminal'

type ConsoleSectionProps = {
  isConnected: boolean
  isRunning: boolean
  isTerminating: boolean
  activeConsoleTab: ConsoleTab
  logs: LogEntry[]
  terminalOutput: string
  terminalInput: string
  isTerminalRunning: boolean
  terminalAppendNewline: boolean
  terminalNewlineMode: TerminalNewlineMode
  terminalRxBytes: number
  terminalHexDisplay: boolean
  terminalShowTimestamp: boolean
  terminalShowControlChars: boolean
  postFlashAction: PostFlashAction
  onRunWorkflow: () => Promise<void>
  onTerminateExecution: () => Promise<void>
  onClearLogs: () => void
  onActiveConsoleTabChange: (value: ConsoleTab) => void
  onStartTerminal: () => Promise<void>
  onStopTerminal: () => Promise<void>
  onClearTerminalOutput: () => void
  onSaveTerminalOutput: () => void
  onTerminalInputChange: (value: string) => void
  onTerminalInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onTerminalNewlineModeChange: (value: TerminalNewlineMode) => void
  onTerminalAppendNewlineChange: (value: boolean) => void
  onTerminalHexDisplayChange: (value: boolean) => void
  onTerminalShowTimestampChange: (value: boolean) => void
  onTerminalShowControlCharsChange: (value: boolean) => void
  onSendTerminalInput: () => Promise<void>
  onSendTerminalSpecialKey: (key: TerminalSpecialKey) => Promise<void>
  onPostFlashActionChange: (value: PostFlashAction) => void
}

export function ConsoleSection(props: ConsoleSectionProps) {
  const { t } = useTranslation()
  const {
    isConnected,
    isRunning,
    isTerminating,
    activeConsoleTab,
    logs,
    terminalOutput,
    terminalInput,
    isTerminalRunning,
    terminalAppendNewline,
    terminalNewlineMode,
    terminalRxBytes,
    terminalHexDisplay,
    terminalShowTimestamp,
    terminalShowControlChars,
    postFlashAction,
    onRunWorkflow,
    onTerminateExecution,
    onClearLogs,
    onActiveConsoleTabChange,
    onStartTerminal,
    onStopTerminal,
    onClearTerminalOutput,
    onSaveTerminalOutput,
    onTerminalInputChange,
    onTerminalInputKeyDown,
    onTerminalNewlineModeChange,
    onTerminalAppendNewlineChange,
    onTerminalHexDisplayChange,
    onTerminalShowTimestampChange,
    onTerminalShowControlCharsChange,
    onSendTerminalInput,
    onSendTerminalSpecialKey,
    onPostFlashActionChange,
  } = props

  const autoScrollLogs = useRef(true)
  const autoScrollTerminal = useRef(true)

  const logsContainerRef = useRef<HTMLDivElement | null>(null)
  const terminalContainerRef = useRef<HTMLDivElement | null>(null)

  const handleLogsScroll = useCallback(() => {
    if (!logsContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current
    autoScrollLogs.current = scrollHeight - scrollTop - clientHeight < 32
  }, [])

  const handleTerminalScroll = useCallback(() => {
    if (!terminalContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current
    autoScrollTerminal.current = scrollHeight - scrollTop - clientHeight < 32
  }, [])

  useEffect(() => {
    if (autoScrollLogs.current && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    if (activeConsoleTab === 'terminal' && autoScrollTerminal.current && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight
    }
  }, [terminalOutput, activeConsoleTab])

  const logLevelClass = useCallback((level: string): string => {
    switch (level) {
      case 'warn': return 'level-warn'
      case 'error': return 'level-error'
      case 'debug': return 'level-debug'
      default: return 'level-info'
    }
  }, [])

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
        </div>
        <h2>{t('logs')}</h2>
      </div>

      <div className="button-row workflow-action-row">
        <button type="button" onClick={() => void onRunWorkflow()} disabled={!isConnected || isRunning}>
          {isRunning ? t('running') : t('startFlash')}
        </button>
        <button
          type="button"
          onClick={() => void onTerminateExecution()}
          disabled={!isRunning || isTerminating}
          style={{ background: 'var(--red)', color: 'white', border: 'none' }}
        >
          {t('terminateExecution')}
        </button>
      </div>

      <div className="console-toolbar">
        <div className="console-toolbar-left">
          <div className="console-segmented">
            <button
              type="button"
              className={`segment-button ${activeConsoleTab === 'logs' ? 'active' : ''}`}
              onClick={() => onActiveConsoleTabChange('logs')}
            >
              {t('logs')}
            </button>
            <button
              type="button"
              className={`segment-button ${activeConsoleTab === 'terminal' ? 'active' : ''}`}
              onClick={() => onActiveConsoleTabChange('terminal')}
            >
              {t('terminal')}
            </button>
          </div>

          <div className="console-tab-actions">
            {activeConsoleTab === 'logs' && (
              <button type="button" onClick={onClearLogs}>{t('clearLogs')}</button>
            )}

            {activeConsoleTab === 'terminal' && (
              <>
                <button
                  type="button"
                  onClick={() => void onStartTerminal()}
                  disabled={!isConnected || isRunning || isTerminalRunning}
                >
                  {t('startTerminal')}
                </button>
                <button
                  type="button"
                  onClick={() => void onStopTerminal()}
                  disabled={!isTerminalRunning}
                >
                  {t('stopTerminal')}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="console-toolbar-right">
          <div className="post-flash-action-segmented">
            <button
              type="button"
              className={`seg-item ${postFlashAction === 'null' ? 'active' : ''}`}
              onClick={() => onPostFlashActionChange('null')}
            >
              {t('postActionNull')}
            </button>
            <button
              type="button"
              className={`seg-item ${postFlashAction === 'console' ? 'active' : ''}`}
              onClick={() => onPostFlashActionChange('console')}
            >
              {t('postActionConsole')}
            </button>
            <button
              type="button"
              className={`seg-item ${postFlashAction === 'failsafe' ? 'active' : ''}`}
              onClick={() => onPostFlashActionChange('failsafe')}
            >
              {t('postActionFailsafe')}
            </button>
          </div>
        </div>
      </div>

      {activeConsoleTab === 'logs' ? (
        <div className="logs-container" ref={logsContainerRef} onScroll={handleLogsScroll}>
          {logs.map((entry) => (
            <div key={entry.id} className={`log-entry ${logLevelClass(entry.level)}`}>
              <span className="timestamp">{entry.timestamp}</span>
              {entry.message}
            </div>
          ))}
        </div>
      ) : (
        <div className="terminal-container">
          <div
            className="terminal-output"
            ref={terminalContainerRef}
            onScroll={handleTerminalScroll}
          >
            {terminalOutput}
          </div>

          <div className="terminal-input-row">
            <input
              type="text"
              value={terminalInput}
              onChange={(event) => onTerminalInputChange(event.target.value)}
              onKeyDown={onTerminalInputKeyDown}
              placeholder={t('terminalInputPlaceholder')}
              disabled={!isTerminalRunning}
            />
            <button
              type="button"
              onClick={() => void onSendTerminalInput()}
              disabled={!isTerminalRunning}
            >
              {t('terminalSend')}
            </button>
          </div>

          <div className="terminal-meta">
            <div className="terminal-meta-actions">
              <div className="terminal-meta-group terminal-meta-group-tight">
                <button type="button" className="btn btn-sm" style={{
                  fontSize: '11px', padding: '4px 8px',
                  background: 'var(--surface2)', color: 'var(--ink2)',
                  border: '1px solid var(--border2)'
                }}                 onClick={() => void onClearTerminalOutput()}>{t('terminalClear')}</button>
                <button type="button" className="btn btn-sm" style={{
                  fontSize: '11px', padding: '4px 8px',
                  background: 'var(--surface2)', color: 'var(--ink2)',
                  border: '1px solid var(--border2)'
                }} onClick={onSaveTerminalOutput}>{t('terminalSave')}</button>
              </div>

              <div className="terminal-meta-group">
                <label>{t('terminalNewline')}</label>
                <select
                  value={terminalNewlineMode}
                  onChange={(event) => onTerminalNewlineModeChange(event.target.value as TerminalNewlineMode)}
                >
                  <option value="crlf">{t('newlineCRLF')}</option>
                  <option value="lf">{t('newlineLF')}</option>
                  <option value="cr">{t('newlineCR')}</option>
                </select>
              </div>

              <div className="terminal-meta-group terminal-meta-group-tight">
                <input
                  type="checkbox"
                  id="append-newline"
                  checked={terminalAppendNewline}
                  onChange={(event) => onTerminalAppendNewlineChange(event.target.checked)}
                />
                <label htmlFor="append-newline">{t('terminalAppendNewline')}</label>
              </div>

              <div className="terminal-meta-group terminal-meta-group-tight">
                <input
                  type="checkbox"
                  id="hex-display"
                  checked={terminalHexDisplay}
                  onChange={(event) => onTerminalHexDisplayChange(event.target.checked)}
                />
                <label htmlFor="hex-display">HEX</label>
              </div>

              <div className="terminal-meta-group terminal-meta-group-tight">
                <input
                  type="checkbox"
                  id="show-timestamp"
                  checked={terminalShowTimestamp}
                  onChange={(event) => onTerminalShowTimestampChange(event.target.checked)}
                />
                <label htmlFor="show-timestamp">{t('terminalShowTimestamp')}</label>
              </div>

              <div className="terminal-meta-group terminal-meta-group-tight">
                <input
                  type="checkbox"
                  id="show-control-chars"
                  checked={terminalShowControlChars}
                  onChange={(event) => onTerminalShowControlCharsChange(event.target.checked)}
                />
                <label htmlFor="show-control-chars">{t('terminalShowControlChars')}</label>
              </div>

              <span className="rx-bytes">RX: {terminalRxBytes} B</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
