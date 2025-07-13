import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
dotenv.config();

interface TokenRequestBody {
  code?: string;
  state?: string;
  redirect_uri?: string;
  code_verifier?: string;
  iss?: string;
}
type StateStore = Record<string, string>;

// In-memory state store
const stateStore: StateStore = {};

const CLIENT_ID = process.env.SMART_CLIENT_ID || 'REPLACE_WITH_CLIENT_ID';
const CLIENT_SECRET = process.env.SMART_CLIENT_SECRET || 'REPLACE_WITH_CLIENT_SECRET';

const app = express();
app.use(express.json());
app.use(cors());

function generateState(stateStore: StateStore, iss: string): string {
  const state = crypto.randomBytes(18).toString('base64url');
  stateStore[state] = iss;
  return state;
}

async function getSmartConfig(iss: string): Promise<any> {
  const url = `${iss}/.well-known/smart-configuration`;
  const resp = await axios.get(url, { headers: { Accept: 'application/json' } });
  return resp.data;
}

// GET /smart/config
app.get('/smart/config', async (req: Request, res: Response) => {
  const iss = req.query.iss as string;
  if (!iss) return res.status(400).json({ detail: 'Missing iss parameter' });
  try {
    const config = await getSmartConfig(iss);
    const state = generateState(stateStore, iss);
    config.state = state;
    res.json(config);
  } catch (err: any) {
    res.status(400).json({ detail: `Failed to fetch SMART config: ${err.response?.data || err.message}` });
  }
});

// POST /smart/token
app.post('/smart/token', async (req: Request<{}, {}, TokenRequestBody>, res: Response) => {
  const { code, state, redirect_uri, code_verifier } = req.body;
  let issuer: string | undefined;
  if (!state) return res.status(400).json({ detail: 'Missing state for code exchange.' });
  issuer = stateStore[state];
  if (!issuer) return res.status(400).json({ detail: 'Unknown or expired state.' });
  try {
    const config = await getSmartConfig(issuer);
    const tokenUrl = config.token_endpoint;
    if (!tokenUrl) return res.status(400).json({ detail: 'No token_endpoint in SMART config.' });
    let authQueryParams: Record<string, string | undefined> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: CLIENT_ID,
    };
    if (code_verifier) authQueryParams.code_verifier = code_verifier;
    if (CLIENT_SECRET !== 'REPLACE_WITH_CLIENT_SECRET') {
      authQueryParams.client_secret = CLIENT_SECRET;
    }
    const params = new URLSearchParams(authQueryParams as Record<string, string>);
    const resp = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json(resp.data);
  } catch (err: any) {
    res.status(400).json({ detail: `Token exchange failed: ${err.response?.data || err.message}` });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SMART-on-FHIR backend listening on port ${PORT}`);
}); 