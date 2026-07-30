import { appParams } from '@/lib/app-params';

const ANALYSIS_FUNCTION_NAME = 'analyzeRefinanceDocument';

const runtimeEnv = Reflect.get(import.meta, 'env') || {};
const configuredAnalysisEndpoint = runtimeEnv.VITE_REFINANCE_ANALYSIS_URL?.trim();
const base44AppId = appParams.appId ? String(appParams.appId) : '';
const analysisEndpoint = configuredAnalysisEndpoint || (
  base44AppId
    ? `/api/apps/${encodeURIComponent(base44AppId)}/functions/${ANALYSIS_FUNCTION_NAME}`
    : ''
);

function getAnalysisHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  // Base44 Builder apps route functions through the app-scoped API. These
  // headers mirror the existing SDK's function invocation so the gateway can
  // select the correct app and deployed function version (including secrets).
  if (!configuredAnalysisEndpoint && base44AppId) {
    headers['X-App-Id'] = base44AppId;
    if (appParams.functionsVersion) {
      headers['Base44-Functions-Version'] = String(appParams.functionsVersion);
    }
  }

  return headers;
}

export class RefinanceAnalysisRequestError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} options
   */
  constructor(message, { status = 0, cause } = {}) {
    super(message);
    this.name = 'RefinanceAnalysisRequestError';
    this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}

export async function analyzeRefinanceDocument(payload) {
  if (!analysisEndpoint) {
    throw new RefinanceAnalysisRequestError(
      'Base44 app ID is not configured for the refinance analyzer',
    );
  }

  let response;
  try {
    response = await fetch(analysisEndpoint, {
      method: 'POST',
      headers: getAnalysisHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new RefinanceAnalysisRequestError(
      error?.message || 'Network error while analyzing the document',
      { cause: error },
    );
  }

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new RefinanceAnalysisRequestError(
        `Analysis service returned an invalid response (HTTP ${response.status})`,
        { status: response.status },
      );
    }
  }

  if (!response.ok) {
    throw new RefinanceAnalysisRequestError(
      data?.error || `Analysis request failed (HTTP ${response.status})`,
      { status: response.status },
    );
  }

  return data;
}
