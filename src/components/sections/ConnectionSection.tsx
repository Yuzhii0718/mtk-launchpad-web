import { useTranslation } from 'react-i18next'
import { CHIP_CONFIG, CHIP_OPTIONS } from '../../constants'
import type { Chip, DdrType, SerialDataBits, SerialParity, SerialStopBits } from '../../types'

type ConnectionSectionProps = {
  detectedPortInfo: string
  connectBaudRate: number
  connectBaudRateOption: string
  customConnectBaudRate: number
  connectDataBits: SerialDataBits
  connectStopBits: SerialStopBits
  connectParity: SerialParity
  isConnected: boolean
  isRunning: boolean
  chip: Chip
  ddr: DdrType
  ddrOptions: DdrType[]
  loadAddress: number
  bromLoadBaudRate: number
  bl2LoadBaudRate: number
  onConnectBaudRateSelect: (value: string) => void
  onCustomConnectBaudRateInput: (value: string) => void
  onConnectDataBitsChange: (value: SerialDataBits) => void
  onConnectStopBitsChange: (value: SerialStopBits) => void
  onConnectParityChange: (value: SerialParity) => void
  onChipChange: (value: Chip) => void
  onDdrChange: (value: DdrType) => void
  onLoadAddressInput: (value: string) => void
  onBromBaudRateInput: (value: string) => void
  onBl2BaudRateInput: (value: string) => void
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  onForgetDevice: () => Promise<void>
}

export function ConnectionSection(props: ConnectionSectionProps) {
  const { t } = useTranslation()
  const {
    detectedPortInfo,
    connectBaudRate,
    connectBaudRateOption,
    customConnectBaudRate,
    connectDataBits,
    connectStopBits,
    connectParity,
    isConnected,
    isRunning,
    chip,
    ddr,
    ddrOptions,
    loadAddress,
    bromLoadBaudRate,
    bl2LoadBaudRate,
    onConnectBaudRateSelect,
    onCustomConnectBaudRateInput,
    onConnectDataBitsChange,
    onConnectStopBitsChange,
    onConnectParityChange,
    onChipChange,
    onDdrChange,
    onLoadAddressInput,
    onBromBaudRateInput,
    onBl2BaudRateInput,
    onConnect,
    onDisconnect,
    onForgetDevice,
  } = props

  return (
    <>
      <section className="card">
        <div className="card-header">
          <div className={`card-icon ${isConnected ? 'green' : 'red'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isConnected
                ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              }
            </svg>
          </div>
          <h2>{t('connectTitle')}</h2>
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">{isConnected ? t('connected') : t('disconnected')}</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label>{t('detectedPort')}</label>
            <div className="info-chip">
              <span className="info-value">{detectedPortInfo}</span>
            </div>
          </div>
          <div className="form-group">
            <label>{t('baudRate')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={connectBaudRateOption}
                onChange={(event) => onConnectBaudRateSelect(event.target.value)}
              >
                <option value="4800">4800</option>
                <option value="9600">9600</option>
                <option value="14400">14400</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="57600">57600</option>
                <option value="115200">115200</option>
                <option value="custom">{t('customBaudRate')}</option>
              </select>
              {connectBaudRateOption === 'custom' && (
                <input
                  type="number"
                  value={customConnectBaudRate}
                  placeholder={t('customBaudRatePlaceholder')}
                  onChange={(event) => onCustomConnectBaudRateInput(event.target.value)}
                  style={{ maxWidth: '130px' }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '12px' }}>
          <div className="form-group">
            <label>{t('dataBits')}</label>
            <select
              value={connectDataBits}
              onChange={(event) => onConnectDataBitsChange(Number(event.target.value) as SerialDataBits)}
            >
              <option value={8}>8</option>
              <option value={7}>7</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('stopBits')}</label>
            <select
              value={connectStopBits}
              onChange={(event) => onConnectStopBitsChange(Number(event.target.value) as SerialStopBits)}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('parity')}</label>
            <select
              value={connectParity}
              onChange={(event) => onConnectParityChange(event.target.value as SerialParity)}
            >
              <option value="none">{t('parityNone')}</option>
              <option value="even">{t('parityEven')}</option>
              <option value="odd">{t('parityOdd')}</option>
            </select>
          </div>
        </div>

        <div className="connect-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="btn btn-primary" onClick={() => void onConnect()} disabled={isConnected}>
            {t('connect')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void onDisconnect()} disabled={!isConnected}>
            {t('disconnect')}
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void onForgetDevice()} disabled={!isConnected || isRunning}>
            {t('forgetDevice')}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div className="card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="3"/>
              <path d="M6 2v20"/>
            </svg>
          </div>
          <h2>{t('firmwareLabel')}</h2>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label>{t('chip')}</label>
            <select value={chip} onChange={(event) => onChipChange(event.target.value as Chip)}>
              {CHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {CHIP_CONFIG[option].label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('ddr')}</label>
            <select value={ddr} onChange={(event) => onDdrChange(event.target.value as DdrType)}>
              {ddrOptions.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '12px' }}>
          <div className="form-group">
            <label>{t('loadAddress')}</label>
            <input
              type="number"
              value={loadAddress}
              onChange={(event) => onLoadAddressInput(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{t('bromBaudRate')}</label>
            <input
              type="number"
              value={bromLoadBaudRate}
              onChange={(event) => onBromBaudRateInput(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{t('bl2BaudRate')}</label>
            <input
              type="number"
              value={bl2LoadBaudRate}
              onChange={(event) => onBl2BaudRateInput(event.target.value)}
            />
          </div>
        </div>
      </section>
    </>
  )
}
