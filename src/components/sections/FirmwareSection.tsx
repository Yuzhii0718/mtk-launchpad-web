import { useTranslation } from 'react-i18next'
import type { FirmwareCandidate, FirmwareSource } from '../../types'
import { candidateKey, formatCandidateLabel } from '../../utils/fileNameParsers'
import { Md5Line } from '../Md5Line'

type LoadMode = 'bl2-only' | 'bl2-fip'

type FirmwareSectionProps = {
  loadMode: LoadMode
  bl2Source: FirmwareSource
  fipSource: Exclude<FirmwareSource, 'builtin'>
  bl2ReleaseApi: string
  bl2ReleaseTag: string
  isLoadingBl2Release: boolean
  fipReleaseApi: string
  fipReleaseTag: string
  isLoadingFipRelease: boolean
  boardFilter: string
  builtinBl2Options: FirmwareCandidate[]
  releaseBl2Options: FirmwareCandidate[]
  releaseFipOptions: FirmwareCandidate[]
  selectedBuiltinBl2Key: string
  selectedReleaseBl2Key: string
  selectedExecutionRemoteBl2Candidate?: FirmwareCandidate
  selectedReleaseFipKey: string
  selectedExecutionRemoteFipCandidate?: FirmwareCandidate
  canDownloadRambootPreloader: boolean
  canUseRemoteBl2ForExecution: boolean
  canDownloadBoardBl2: boolean
  canDownloadFip: boolean
  canUseRemoteFipForExecution: boolean
  bl2ExpectedMd5?: string
  bl2ActualMd5?: string
  bl2Md5Passed: boolean | null
  fipExpectedMd5?: string
  fipActualMd5?: string
  fipMd5Passed: boolean | null
  onLoadModeChange: (value: LoadMode) => void
  onBl2SourceChange: (value: FirmwareSource) => void
  onBl2ReleaseApiChange: (value: string) => void
  onFetchBl2Release: () => Promise<void>
  onSelectedBuiltinBl2KeyChange: (value: string) => void
  onSelectedReleaseBl2KeyChange: (value: string) => void
  onUseRemoteBl2ForExecution: () => Promise<void>
  onDownloadRambootPreloader: () => Promise<void>
  onUploadedBl2FileChange: (file: File | null) => void
  onRunBl2Md5Check: () => Promise<void>
  onFipSourceChange: (value: Exclude<FirmwareSource, 'builtin'>) => void
  onFipReleaseApiChange: (value: string) => void
  onBoardFilterChange: (value: string) => void
  onFetchFipRelease: () => Promise<void>
  onSelectedReleaseFipKeyChange: (value: string) => void
  onUseRemoteFipForExecution: () => Promise<void>
  onDownloadBoardBl2: () => Promise<void>
  onDownloadFip: () => Promise<void>
  onUploadedFipFileChange: (file: File | null) => void
  onRunFipMd5Check: () => Promise<void>
  cdnMirrorUrl: string
  onCdnMirrorUrlChange: (value: string) => void
  cdnMirrorEnabled: boolean
  onCdnMirrorEnabledChange: (value: boolean) => void
}

function Bl2Panel(props: FirmwareSectionProps) {
  const { t } = useTranslation()
  const {
    bl2Source,
    bl2ReleaseApi,
    bl2ReleaseTag,
    isLoadingBl2Release,
    builtinBl2Options,
    releaseBl2Options,
    selectedBuiltinBl2Key,
    selectedReleaseBl2Key,
    selectedExecutionRemoteBl2Candidate,
    canDownloadRambootPreloader,
    canUseRemoteBl2ForExecution,
    bl2ExpectedMd5,
    bl2ActualMd5,
    bl2Md5Passed,
    onBl2SourceChange,
    onBl2ReleaseApiChange,
    onFetchBl2Release,
    onSelectedBuiltinBl2KeyChange,
    onSelectedReleaseBl2KeyChange,
    onUseRemoteBl2ForExecution,
    onDownloadRambootPreloader,
    onUploadedBl2FileChange,
    onRunBl2Md5Check,
  } = props

  return (
    <>
      <div className="tab-bar" style={{ maxWidth: '400px' }}>
        <button
          type="button"
          className={bl2Source === 'builtin' ? 'active' : ''}
          onClick={() => onBl2SourceChange('builtin')}
        >
          {t('builtin')}
        </button>
        <button
          type="button"
          className={bl2Source === 'github-release' ? 'active' : ''}
          onClick={() => onBl2SourceChange('github-release')}
        >
          {t('githubRelease')}
        </button>
        <button
          type="button"
          className={bl2Source === 'upload' ? 'active' : ''}
          onClick={() => onBl2SourceChange('upload')}
        >
          {t('uploadLocal')}
        </button>
      </div>

      {bl2Source === 'builtin' && (
        <div className="form-group">
          <label>{t('chooseBl2')}</label>
          <select
            value={selectedBuiltinBl2Key}
            onChange={(event) => onSelectedBuiltinBl2KeyChange(event.target.value)}
          >
            {builtinBl2Options.map((candidate) => (
              <option key={candidateKey(candidate)} value={candidateKey(candidate)}>
                {formatCandidateLabel(candidate)}
              </option>
            ))}
          </select>
        </div>
      )}

      {bl2Source === 'github-release' && (
        <>
          <div className="release-api-section">
            <div className="input-group">
              <div className="form-group">
                <label>{t('bl2ReleaseApi')}</label>
                <input type="text" className="release-api-input" value={bl2ReleaseApi} onChange={(event) => onBl2ReleaseApiChange(event.target.value)} placeholder="https://api.github.com/repos/..." />
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void onFetchBl2Release()} disabled={isLoadingBl2Release} style={{ flexShrink: 0 }}>
                {t('fetchBl2Release')}
              </button>
            </div>
            <div className="release-tag">
              <span className={`tag-dot${bl2ReleaseTag ? '' : ' pending'}`} />
              <span className="tag-label">{t('releaseTag')}</span>
              <span className="tag-value">{bl2ReleaseTag}</span>
            </div>
          </div>
          <div className="form-group">
            <label>{t('chooseBl2')}</label>
            <select
              value={selectedReleaseBl2Key}
              onChange={(event) => onSelectedReleaseBl2KeyChange(event.target.value)}
            >
              {releaseBl2Options.map((candidate) => (
                <option key={candidateKey(candidate)} value={candidateKey(candidate)}>
                  {formatCandidateLabel(candidate)}
                </option>
              ))}
            </select>
          </div>
          <div className="button-row" style={{ marginTop: '12px' }}>
            <button type="button" className="btn btn-primary" onClick={() => void onUseRemoteBl2ForExecution()} disabled={!canUseRemoteBl2ForExecution}>
              {t('useRemoteBl2ForRun')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void onDownloadRambootPreloader()} disabled={!canDownloadRambootPreloader}>
              {t('downloadRambootPreloaderToLocal')}
            </button>
          </div>
          {!selectedExecutionRemoteBl2Candidate && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '8px' }}>{t('remoteBl2NotSelectedForRun')}</p>}
          {selectedExecutionRemoteBl2Candidate && (
            <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '8px' }}>{t('remoteBl2InUse')}: {selectedExecutionRemoteBl2Candidate.fileName}</p>
          )}
          {!canDownloadRambootPreloader && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '4px' }}>{t('noSelectedBl2DownloadHint')}</p>}
          <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '4px' }}>{t('downloadUsesBrowserHint')}</p>
        </>
      )}

      {bl2Source === 'upload' && (
        <div className="form-group">
          <label>{t('uploadLocal')}</label>
          <input
            type="file"
            onChange={(event) => onUploadedBl2FileChange(event.target.files?.[0] ?? null)}
            accept=".bin,.img"
          />
        </div>
      )}

      <div className="md5-verify-section">
        <div className="button-row">
          <button type="button" className="btn btn-secondary" onClick={() => void onRunBl2Md5Check()}>
            {t('verifyMd5')} (BL2)
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink3)', margin: '8px 0' }}>{t('autoVerifyHint')}</p>
        <Md5Line
          expectedLabel={t('expectedMd5')}
          actualLabel={t('actualMd5')}
          expected={bl2ExpectedMd5}
          actual={bl2ActualMd5}
          passed={bl2Md5Passed}
        />
      </div>
    </>
  )
}

function FipPanel(props: FirmwareSectionProps) {
  const { t } = useTranslation()
  const {
    fipSource,
    fipReleaseApi,
    fipReleaseTag,
    isLoadingFipRelease,
    boardFilter,
    releaseFipOptions,
    selectedReleaseFipKey,
    selectedExecutionRemoteFipCandidate,
    canDownloadBoardBl2,
    canDownloadFip,
    canUseRemoteFipForExecution,
    fipExpectedMd5,
    fipActualMd5,
    fipMd5Passed,
    onFipSourceChange,
    onFipReleaseApiChange,
    onBoardFilterChange,
    onFetchFipRelease,
    onSelectedReleaseFipKeyChange,
    onUseRemoteFipForExecution,
    onDownloadBoardBl2,
    onDownloadFip,
    onUploadedFipFileChange,
    onRunFipMd5Check,
  } = props

  return (
    <>
      <div className="tab-bar" style={{ maxWidth: '260px' }}>
        <button
          type="button"
          className={fipSource === 'github-release' ? 'active' : ''}
          onClick={() => onFipSourceChange('github-release')}
        >
          {t('githubRelease')}
        </button>
        <button
          type="button"
          className={fipSource === 'upload' ? 'active' : ''}
          onClick={() => onFipSourceChange('upload')}
        >
          {t('uploadLocal')}
        </button>
      </div>

      {fipSource === 'github-release' && (
        <>
          <div className="release-api-section">
            <div className="input-group">
              <div className="form-group">
                <label>{t('fipReleaseApi')}</label>
                <input type="text" className="release-api-input" value={fipReleaseApi} onChange={(event) => onFipReleaseApiChange(event.target.value)} placeholder="https://api.github.com/repos/..." />
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => void onFetchFipRelease()} disabled={isLoadingFipRelease} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {t('fetchFipRelease')}
              </button>
            </div>
            <div className="form-group">
              <label>{t('boardFilter')}</label>
              <input type="text" value={boardFilter} onChange={(event) => onBoardFilterChange(event.target.value)} placeholder={t('boardFilterPlaceholder')} />
            </div>
            <div className="release-tag">
              <span className={`tag-dot${fipReleaseTag ? '' : ' pending'}`} />
              <span className="tag-label">{t('releaseTag')}</span>
              <span className="tag-value">{fipReleaseTag || '...'}</span>
            </div>
          </div>

          <div className="form-group">
            <label>{t('chooseFip')}</label>
            <select
              value={selectedReleaseFipKey}
              onChange={(event) => onSelectedReleaseFipKeyChange(event.target.value)}
            >
              {releaseFipOptions.map((candidate) => (
                <option key={candidateKey(candidate)} value={candidateKey(candidate)}>
                  {formatCandidateLabel(candidate)}
                </option>
              ))}
            </select>
          </div>

          <div className="button-row" style={{ marginTop: '12px' }}>
            <button type="button" className="btn btn-primary" onClick={() => void onUseRemoteFipForExecution()} disabled={!canUseRemoteFipForExecution}>
              {t('useRemoteFipForRun')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void onDownloadBoardBl2()} disabled={!canDownloadBoardBl2}>
              {t('downloadBl2ToLocal')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void onDownloadFip()} disabled={!canDownloadFip}>
              {t('downloadFipToLocal')}
            </button>
          </div>
          {!selectedExecutionRemoteFipCandidate && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '8px' }}>{t('remoteFipNotSelectedForRun')}</p>}
          {selectedExecutionRemoteFipCandidate && (
            <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '8px' }}>{t('remoteFipInUse')}: {selectedExecutionRemoteFipCandidate.fileName}</p>
          )}
          {(!canDownloadBoardBl2 || !canDownloadFip) && (
            <>
              {!canDownloadBoardBl2 && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '4px' }}>{t('noMatchedBoardBl2')}</p>}
              {!canDownloadFip && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '4px' }}>{t('noSelectedFipDownloadHint')}</p>}
            </>
          )}
          <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '4px' }}>{t('downloadUsesBrowserHint')}</p>
        </>
      )}

      {fipSource === 'upload' && (
        <div className="form-group">
          <label>{t('uploadLocal')}</label>
          <input
            type="file"
            onChange={(event) => onUploadedFipFileChange(event.target.files?.[0] ?? null)}
            accept=".bin,.img"
          />
        </div>
      )}

      <div className="md5-verify-section">
        <div className="button-row">
          <button type="button" className="btn btn-secondary" onClick={() => void onRunFipMd5Check()}>
            {t('verifyMd5')} (FIP)
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink3)', margin: '8px 0' }}>{t('autoVerifyHint')}</p>
        <Md5Line
          expectedLabel={t('expectedMd5')}
          actualLabel={t('actualMd5')}
          expected={fipExpectedMd5}
          actual={fipActualMd5}
          passed={fipMd5Passed}
        />
      </div>
    </>
  )
}

export function FirmwareSection(props: FirmwareSectionProps) {
  const { t } = useTranslation()
  const {
    loadMode, onLoadModeChange,
    bl2Source, fipSource,
    cdnMirrorUrl, onCdnMirrorUrlChange,
    cdnMirrorEnabled, onCdnMirrorEnabledChange,
  } = props

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-icon amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3"/>
            <path d="M12 2v20"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <h2>{t('rambootBl2Source')}</h2>
      </div>

      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label>{t('loadMode')}</label>
        <div className="tab-bar" style={{ maxWidth: '300px' }}>
          <button
            type="button"
            className={loadMode === 'bl2-only' ? 'active' : ''}
            onClick={() => onLoadModeChange('bl2-only')}
          >
            {t('bl2Only')}
          </button>
          <button
            type="button"
            className={loadMode === 'bl2-fip' ? 'active' : ''}
            onClick={() => onLoadModeChange('bl2-fip')}
          >
            {t('bl2AndFip')}
          </button>
        </div>
      </div>

      {(bl2Source === 'github-release' || fipSource === 'github-release') && (
        <div className="cdn-mirror-section" style={{ marginBottom: '16px', padding: '12px', border: `1px solid var(--border2)`, borderRadius: 'var(--radius-sm)', background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label className="toggle-wrapper">
              <input
                type="checkbox"
                checked={cdnMirrorEnabled}
                onChange={(e) => onCdnMirrorEnabledChange(e.target.checked)}
              />
              <span className="toggle-label">{t('cdnMirrorToggle')}</span>
            </label>
          </div>
          {cdnMirrorEnabled && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>{t('cdnMirrorUrl')}</label>
              <input
                type="text"
                className="release-api-input"
                value={cdnMirrorUrl}
                onChange={(e) => onCdnMirrorUrlChange(e.target.value)}
                placeholder={t('cdnMirrorPlaceholder')}
              />
            </div>
          )}
        </div>
      )}

      <div className="form-grid-2" style={{ gap: '24px' }}>
        <div style={{ borderRight: loadMode === 'bl2-fip' ? '1px solid var(--border)' : 'none', paddingRight: loadMode === 'bl2-fip' ? '24px' : '0' }}>
          <Bl2Panel {...props} />
        </div>
        {loadMode === 'bl2-fip' && (
          <div style={{ paddingLeft: '24px' }}>
            <FipPanel {...props} />
          </div>
        )}
      </div>
    </section>
  )
}
