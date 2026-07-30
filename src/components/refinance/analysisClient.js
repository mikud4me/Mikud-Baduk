const DEFAULT_ANALYSIS_ENDPOINT = '/functions/analyzeRefinanceDocument';

const runtimeEnv = Reflect.get(import.meta, 'env') || {};
const analysisEndpoint =
  runtimeEnv.VITE_REFINANCE_ANALYSIS_URL?.trim() || DEFAULT_ANALYSIS_ENDPOINT;

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
  let response;
  try {
    response = await fetch(analysisEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
