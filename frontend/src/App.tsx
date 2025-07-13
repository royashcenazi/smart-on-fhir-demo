import React from 'react';

const clientId = 'REPLACE_WITH_CLIENT_ID';
const redirectUri = 'http://localhost:5173';
const backendUrl = 'http://localhost:3001';

type AuthorizeConfig = {
  authorization_endpoint: string;
  state: string;
  [key: string]: any;
} | null;

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  patient?: string;
  [key: string]: any;
};

function getQueryParams(): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(window.location.search)) as Record<string, string>;
}

class App extends React.Component<{}, {
  phase: string;
  accessToken: string | null;
  refreshToken: string | null;
  patientId: string | null;
  error: string | null;
  loading: boolean;
}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      phase: 'init',
      accessToken: null,
      refreshToken: null,
      patientId: null,
      error: null,
      loading: false,
    };
  }

  setPhase = (phase: string) => this.setState({ phase });
  setLoading = (loading: boolean) => this.setState({ loading });
  setAccessToken = (accessToken: string | null) => this.setState({ accessToken });
  setRefreshToken = (refreshToken: string | null) => this.setState({ refreshToken });
  setPatientId = (patientId: string | null) => this.setState({ patientId });
  setError = (error: string | null) => this.setState({ error });

  async getAutRedirectParams(iss: string): Promise<AuthorizeConfig> {
    this.setPhase('discover-config');
    this.setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/smart/config?iss=${encodeURIComponent(iss)}`);
      if (!res.ok) throw new Error('Failed to fetch SMART config');
      const config = await res.json();
      return config;
    } catch (e: any) {
      this.setError(e.message);
      throw e;
    } finally {
      this.setLoading(false);
    }
  }

  buildAuthorizeUrl(config: AuthorizeConfig, params: Record<string, string>): string {
    if (!config) return '';
    const base = config.authorization_endpoint;
    const q = new URLSearchParams(params);
    return `${base}?${q.toString()}`;
  }

  async exchangeCodeForToken(state: string, code: string, codeVerifier?: string) {
    this.setPhase('exchange-token');
    this.setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/smart/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        })
      });
      if (!res.ok) throw new Error('Failed to exchange code for token');
      const data: TokenResponse = await res.json();
      this.setAccessToken(data.access_token ?? null);
      this.setRefreshToken(data.refresh_token ?? null);
      if (data.patient) this.setPatientId(data.patient);
      return data;
    } catch (e: any) {
      this.setError(e.message);
      throw e;
    } finally {
      this.setLoading(false);
    }
  }

  async refreshAccessToken(iss: string, refreshTokenVal: string) {
    this.setPhase('refresh-token');
    this.setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/smart/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iss,
          refresh_token: refreshTokenVal,
          grant_type: 'refresh_token',
        })
      });
      if (!res.ok) throw new Error('Failed to refresh token');
      const data: TokenResponse = await res.json();
      this.setAccessToken(data.access_token ?? null);
      this.setRefreshToken(data.refresh_token ?? null);
      return data;
    } catch (e: any) {
      this.setError(e.message);
      throw e;
    } finally {
      this.setLoading(false);
    }
  }

  async componentDidMount() {
    const params = getQueryParams();
    // Step 1: EHR launch
    if (params.iss && params.launch) {
      // Phase 2: Generate state with well known config in backend
      const authConfig = await this.getAutRedirectParams(params.iss);
      // Phase 3: Build authorize URL (and redirect to it, injecting with the redirect back to this app)
      const authorizeParams = {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'launch openid fhirUser patient/*.read',
        aud: params.iss,
        launch: params.launch,
        state: authConfig?.state || '' // Use backend-provided state
      };
      const url = this.buildAuthorizeUrl(authConfig, authorizeParams);
      window.location.replace(url);
      return;
    }
    // Step 4: Handle redirect back from EHR
    if (params.code && params.state) {
      // The backend has a mapping of state per iss
      await this.exchangeCodeForToken(params.state, params.code);
      return;
    }
  }

  render() {
    const { phase, loading, error, accessToken, refreshToken, patientId } = this.state;
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: 8 }}>
        <h1>SMART on FHIR React App</h1>
        {loading ? (
          <div>Loading phase: {phase}</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : accessToken ? (
          <>
            <h2>Access Token</h2>
            <pre>{accessToken}</pre>
            {refreshToken && (
              <button onClick={() => this.refreshAccessToken('', refreshToken)}>
                Refresh Token
              </button>
            )}
            {patientId && (
              <p><strong>Patient Context:</strong> {patientId}</p>
            )}
          </>
        ) : (
          <p>
            The EHR will launch with <code>?iss=</code> and <code>&amp;launch=</code> parameters.
          </p>
        )}
      </div>
    );
  }
}

export default App; 