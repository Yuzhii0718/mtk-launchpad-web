import type { FirmwareCandidate, FirmwareSource } from '../types'
import { candidateKey, parseFirmwareName } from './fileNameParsers'
import { downloadFirmwareCandidate, type CdnMirrorConfig } from './githubRelease'

export async function resolveBl2Selection(input: {
  bl2Source: FirmwareSource
  builtinBl2Options: FirmwareCandidate[]
  selectedBuiltinBl2Key: string
  releaseBl2Options: FirmwareCandidate[]
  selectedReleaseBl2Key: string
  uploadedBl2File: File | null
  executionRemoteBl2Key?: string
  cdn?: CdnMirrorConfig
}): Promise<{ candidate: FirmwareCandidate; payload: ArrayBuffer }> {
  const {
    bl2Source,
    builtinBl2Options,
    selectedBuiltinBl2Key,
    releaseBl2Options,
    selectedReleaseBl2Key,
    uploadedBl2File,
    executionRemoteBl2Key,
    cdn,
  } = input
  if (bl2Source === 'builtin') {
    const candidate = builtinBl2Options.find((item) => candidateKey(item) === selectedBuiltinBl2Key)
    if (!candidate) {
      throw new Error('BL2 built-in file is not selected')
    }
    return {
      candidate,
      payload: await downloadFirmwareCandidate(candidate, cdn),
    }
  }

  if (bl2Source === 'github-release') {
    const pickKey = executionRemoteBl2Key || selectedReleaseBl2Key
    const candidate = releaseBl2Options.find((item) => candidateKey(item) === pickKey)
    if (!candidate) {
      throw new Error('BL2 release file is not selected')
    }
    return {
      candidate,
      payload: await downloadFirmwareCandidate(candidate, cdn),
    }
  }

  if (!uploadedBl2File) {
    throw new Error('BL2 upload file is required')
  }

  const parsed = parseFirmwareName(uploadedBl2File.name)
  const candidate: FirmwareCandidate = parsed
    ? { ...parsed, source: 'upload' }
    : {
      kind: 'bl2',
      fileName: uploadedBl2File.name,
      chip: null,
      source: 'upload',
    }

  return {
    candidate,
    payload: await uploadedBl2File.arrayBuffer(),
  }
}

export async function resolveFipSelection(input: {
  fipSource: Exclude<FirmwareSource, 'builtin'>
  releaseFipOptions: FirmwareCandidate[]
  selectedReleaseFipKey: string
  uploadedFipFile: File | null
  executionRemoteFipKey?: string
  cdn?: CdnMirrorConfig
}): Promise<{ candidate: FirmwareCandidate; payload: ArrayBuffer }> {
  const { fipSource, releaseFipOptions, selectedReleaseFipKey, uploadedFipFile, executionRemoteFipKey, cdn } = input
  if (fipSource === 'github-release') {
    const pickKey = executionRemoteFipKey || selectedReleaseFipKey
    const candidate = releaseFipOptions.find((item) => candidateKey(item) === pickKey)
    if (!candidate) {
      throw new Error('FIP release file is not selected')
    }
    return {
      candidate,
      payload: await downloadFirmwareCandidate(candidate, cdn),
    }
  }

  if (!uploadedFipFile) {
    throw new Error('FIP upload file is required')
  }

  const parsed = parseFirmwareName(uploadedFipFile.name)
  const candidate: FirmwareCandidate = parsed
    ? { ...parsed, source: 'upload' }
    : {
      kind: 'fip',
      fileName: uploadedFipFile.name,
      chip: null,
      source: 'upload',
    }

  return {
    candidate,
    payload: await uploadedFipFile.arrayBuffer(),
  }
}
